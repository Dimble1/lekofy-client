import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adsAPI, chatAPI, normalizeMediaList, resolveMediaUrl } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingAnimation from '../components/LoadingAnimation.jsx';
import chatEmptyIllustration from '../assets/chat-empty.svg';

const QUICK_REPLIES = [
  'Здравствуйте! Товар ещё актуален?',
  'Можно немного уступить по цене?',
  'Когда сможете отправить?',
  'Можно фото/видео вживую?',
];

const EMOJIS = ['🙂', '👍', '🔥', '🙏', '✅', '😎', '🤝', '💬'];
const MAX_CUSTOM_REPLIES = 5;

function formatPrice(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Цена не указана';
  return `${amount.toLocaleString('ru-RU')} сом`;
}

function loadStoredReplies(chatId) {
  if (!chatId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`lekofy-chat-quick-replies:${chatId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === 'string' && item.trim())
      : [];
  } catch {
    return [];
  }
}

function ChatWindow({ chatId, title, adId, profileUserId, profileName, embedded = false }) {
  const { isLoggedIn, user } = useAuth();
  const { navigate } = useRouter();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageQuery, setMessageQuery] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [linkedAd, setLinkedAd] = useState(null);
  const [customReplies, setCustomReplies] = useState([]);

  const intervalRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const typingStopRef = useRef(null);
  const supportsReadRef = useRef(true);
  const supportsTypingRef = useRef(true);
  const messagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const menuPanelRef = useRef(null);
  const textareaRef = useRef(null);

  const loadMessages = useCallback(
    async (withLoader = false) => {
      if (!chatId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        if (withLoader) setLoading(true);
        setError('');
        const data = await chatAPI.getMessages(chatId);
        const list = Array.isArray(data) ? data : [];
        setMessages(list);

        const hasUnreadFromOther = list.some(
          (msg) => Number(msg.senderId) !== Number(user?.id) && !msg.isRead,
        );

        if (hasUnreadFromOther && supportsReadRef.current) {
          try {
            await chatAPI.markAsRead(chatId);
          } catch (readErr) {
            if (readErr?.status === 404) {
              supportsReadRef.current = false;
            } else {
              throw readErr;
            }
          }
        }
      } catch (e) {
        setError(e.message || 'Не удалось загрузить сообщения');
      } finally {
        setLoading(false);
      }
    },
    [chatId, user?.id],
  );

  const loadTyping = useCallback(async () => {
    if (!chatId || !supportsTypingRef.current) {
      setIsOtherTyping(false);
      return;
    }

    try {
      const data = await chatAPI.getTyping(chatId);
      const ids = Array.isArray(data?.userIds) ? data.userIds : [];
      setIsOtherTyping(ids.some((id) => Number(id) !== Number(user?.id)));
    } catch (typingErr) {
      if (typingErr?.status === 404) {
        supportsTypingRef.current = false;
      }
      setIsOtherTyping(false);
    }
  }, [chatId, user?.id]);

  const refreshChatContext = useCallback(async () => {
    if (!chatId) return;

    try {
      const data = await chatAPI.getById(chatId);
      setChatInfo(data || null);
      if (data?.Ad) {
        setLinkedAd(data.Ad);
      }
    } catch {
      setChatInfo(null);
    }
  }, [chatId]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    loadMessages(true);
    intervalRef.current = setInterval(() => loadMessages(false), 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoggedIn, navigate, loadMessages]);

  useEffect(() => {
    if (!isLoggedIn || !chatId) {
      setIsOtherTyping(false);
      return;
    }

    loadTyping();
    typingIntervalRef.current = setInterval(() => loadTyping(), 1500);

    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      setIsOtherTyping(false);
    };
  }, [isLoggedIn, chatId, loadTyping]);

  useEffect(() => {
    refreshChatContext();
  }, [chatId, refreshChatContext]);

  useEffect(() => {
    if (!adId) return;

    let cancelled = false;
    adsAPI.getById(adId)
      .then((data) => {
        if (!cancelled && data) {
          setLinkedAd(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [adId]);

  useEffect(() => {
    if (!chatId) {
      setCustomReplies([]);
      return;
    }
    setCustomReplies(loadStoredReplies(chatId));
  }, [chatId]);

  useEffect(() => {
    if (!chatId || typeof window === 'undefined') return;
    localStorage.setItem(`lekofy-chat-quick-replies:${chatId}`, JSON.stringify(customReplies));
  }, [chatId, customReplies]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const close = (event) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(event.target)) {
        setEmojiOpen(false);
      }
      if (menuPanelRef.current && !menuPanelRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(
    () => () => {
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      if (chatId && supportsTypingRef.current) {
        chatAPI.setTyping(chatId, false).catch(() => {});
      }
    },
    [chatId],
  );

  const filteredMessages = useMemo(() => {
    const q = messageQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((msg) => (msg.text || msg.content || '').toLowerCase().includes(q));
  }, [messages, messageQuery]);

  const counterparty = useMemo(() => {
    const buyer = chatInfo?.Buyer || null;
    const seller = chatInfo?.Seller || null;
    if (!chatInfo) return null;

    if (Number(chatInfo.buyerId) === Number(user?.id)) return seller;
    if (Number(chatInfo.sellerId) === Number(user?.id)) return buyer;

    return seller || buyer;
  }, [chatInfo, user?.id]);

  const resolvedTitle = linkedAd?.title || title || counterparty?.name || 'Чат';
  const resolvedProfileName = profileName || counterparty?.name || resolvedTitle;
  const resolvedProfileUserId = profileUserId || counterparty?.id || chatInfo?.Seller?.id || chatInfo?.Buyer?.id || null;
  const adImage = normalizeMediaList(linkedAd?.images)[0] || '';

  const stopTyping = useCallback(async () => {
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    if (!chatId || !supportsTypingRef.current) return;
    try {
      await chatAPI.setTyping(chatId, false);
    } catch (typingErr) {
      if (typingErr?.status === 404) {
        supportsTypingRef.current = false;
      }
    }
  }, [chatId]);

  const pingTyping = useCallback(() => {
    if (!chatId || !supportsTypingRef.current) return;

    chatAPI.setTyping(chatId, true).catch((typingErr) => {
      if (typingErr?.status === 404) {
        supportsTypingRef.current = false;
      }
    });

    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => {
      if (!supportsTypingRef.current) return;
      chatAPI.setTyping(chatId, false).catch((typingErr) => {
        if (typingErr?.status === 404) {
          supportsTypingRef.current = false;
        }
      });
    }, 1200);
  }, [chatId]);

  const handleTextChange = (value) => {
    setText(value);
    if (value.trim()) pingTyping();
    else stopTyping();
  };

  const openAdDetail = () => {
    if (linkedAd?.id) {
      navigate('ad-detail', { id: linkedAd.id });
    }
  };

  const createQuickReply = () => {
    const value = window.prompt('Введите текст быстрого сообщения');
    const trimmed = value?.trim();
    if (!trimmed) return;

    setCustomReplies((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)];
      return next.slice(0, MAX_CUSTOM_REPLIES);
    });
    setText(trimmed);
    requestAnimationFrame(() => textareaRef.current?.focus());
    if (trimmed) pingTyping();
  };

  const handleQuickReply = (value) => {
    setText(value);
    requestAnimationFrame(() => textareaRef.current?.focus());
    if (value.trim()) pingTyping();
    else stopTyping();
  };

  const addEmoji = (emoji) => {
    setText((prev) => {
      const next = `${prev}${emoji}`;
      if (next.trim()) pingTyping();
      return next;
    });
    requestAnimationFrame(() => textareaRef.current?.focus());
    setEmojiOpen(false);
  };

  const handleReport = () => {
    setMenuOpen(false);
    const reason = window.prompt('Опишите причину жалобы');
    if (!reason || !reason.trim()) return;
    window.alert('Жалоба отправлена модераторам.');
  };

  const handleBlock = () => {
    setMenuOpen(false);
    window.alert('Пользователь заблокирован.');
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!String(file.type || '').startsWith('image/')) {
      setError('Можно отправлять только фото');
      event.target.value = '';
      return;
    }

    if (!chatId || sending) {
      event.target.value = '';
      return;
    }

    setError('');
    setSending(true);
    chatAPI
      .sendImageMessage(chatId, file)
      .then(() => loadMessages(false))
      .catch((e) => setError(e.message || 'Не удалось отправить фото'))
      .finally(() => setSending(false));

    event.target.value = '';
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !chatId) return;

    try {
      setSending(true);
      await stopTyping();
      setText('');
      await chatAPI.sendMessage(chatId, trimmed);
      await loadMessages(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (e) {
      setError(e.message || 'Не удалось отправить сообщение');
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const quickReplies = useMemo(() => {
    const list = [...customReplies, ...QUICK_REPLIES];
    return Array.from(new Set(list));
  }, [customReplies]);

  if (!isLoggedIn) return null;

  const content = (
    <div className="neo-window">
      <div className="neo-window-header">
        <button
          type="button"
          className="neo-window-avatar neo-chat-avatar-btn"
          onClick={() => {
            if (resolvedProfileUserId) navigate('profile', { userId: resolvedProfileUserId });
          }}
          disabled={!resolvedProfileUserId}
          title={resolvedProfileUserId ? 'Открыть профиль' : 'Профиль недоступен'}
        >
          {(resolvedProfileName || 'Чат').charAt(0).toUpperCase()}
        </button>

        <div className="neo-window-title-wrap">
          <button
            type="button"
            className="neo-profile-link"
            onClick={() => {
              if (resolvedProfileUserId) navigate('profile', { userId: resolvedProfileUserId });
            }}
            disabled={!resolvedProfileUserId}
            title={resolvedProfileUserId ? 'Перейти в профиль' : 'Профиль недоступен'}
          >
            {resolvedProfileName}
          </button>
          <div className="neo-window-status">{isOtherTyping ? 'печатает...' : 'в сети'}</div>
        </div>

        <div className="neo-window-actions">
          <button
            type="button"
            className="neo-icon-btn"
            onClick={() => setSearchOpen((value) => !value)}
            title="Поиск по сообщениям"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <div className="neo-menu-wrap" ref={menuPanelRef}>
            <button type="button" className="neo-icon-btn" onClick={() => setMenuOpen((value) => !value)} title="Меню">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="5" cy="12" r="1.8" fill="currentColor" />
                <circle cx="12" cy="12" r="1.8" fill="currentColor" />
                <circle cx="19" cy="12" r="1.8" fill="currentColor" />
              </svg>
            </button>

            {menuOpen && (
              <div className="neo-menu-panel">
                <button type="button" onClick={handleReport}>Пожаловаться</button>
                <button type="button" onClick={handleBlock}>Заблокировать</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {linkedAd && (
        <button type="button" className="neo-chat-ad-card" onClick={openAdDetail}>
          <div className="neo-chat-ad-media">
            {adImage ? <img src={resolveMediaUrl(adImage)} alt={linkedAd.title || 'Объявление'} /> : <span>•</span>}
          </div>
          <div className="neo-chat-ad-body">
            <div className="neo-chat-ad-title">{linkedAd.title || 'Объявление'}</div>
            <div className="neo-chat-ad-price">{formatPrice(linkedAd.price)}</div>
            <div className="neo-chat-ad-meta">{linkedAd.city || 'Город не указан'}</div>
          </div>
          <span className="neo-chat-ad-arrow">›</span>
        </button>
      )}

      {searchOpen && (
        <div className="neo-search-panel">
          <input
            type="text"
            value={messageQuery}
            onChange={(event) => setMessageQuery(event.target.value)}
            placeholder="Поиск по сообщениям..."
          />
        </div>
      )}

      <div className="neo-messages" ref={messagesRef}>
        {loading && (
          <LoadingAnimation
            message="Загружаем переписку..."
            hint="Подтягиваем сообщения и статусы"
          />
        )}

        {!loading && !messages.length && (
          <div className="empty chat-empty">
            <img src={chatEmptyIllustration} alt="Пустой диалог" className="chat-empty-svg" />
            <div>Начните диалог первым сообщением</div>
          </div>
        )}

        {!loading && messages.length > 0 && !filteredMessages.length && (
          <div className="empty">По запросу ничего не найдено</div>
        )}

        {!loading &&
          filteredMessages.map((msg) => {
            const mine = Number(msg.senderId) === Number(user?.id);
            const time = new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const textMsg = msg.text || msg.content || '';
            const imageUrl = msg.imageUrl || '';

            return (
              <div key={msg.id} className={`neo-msg-row ${mine ? 'me' : 'them'}`}>
                <div className="neo-msg-bubble">
                  {imageUrl ? (
                    <img className="neo-msg-image" src={resolveMediaUrl(imageUrl)} alt="Фото в чате" />
                  ) : (
                    <div>{textMsg}</div>
                  )}
                  <div className="neo-msg-meta">
                    <span>{time}</span>
                  </div>
                  {mine && msg.isRead && <div className="neo-msg-read">прочитано</div>}
                </div>
              </div>
            );
          })}

        {!loading && isOtherTyping && (
          <div className="neo-msg-row them neo-typing-row">
            <div className="neo-msg-bubble neo-typing-bubble">
              <span className="neo-typing-label">печатает</span>
              <span className="neo-typing-dots" aria-label="typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="neo-quick-row">
        <button type="button" className="neo-chip neo-chip--create" onClick={createQuickReply}>
          <span className="neo-chip__plus">+</span>
          <span>Создать</span>
        </button>

        {quickReplies.map((reply) => (
          <button key={reply} type="button" className="neo-chip" onClick={() => handleQuickReply(reply)}>
            {reply}
          </button>
        ))}
      </div>

      <div className="neo-input-wrap">
        <div className="neo-input-tools" ref={emojiPanelRef}>
          <button type="button" className="neo-icon-btn" onClick={() => setEmojiOpen((value) => !value)} title="Эмодзи">
            <span>🙂</span>
          </button>

          {emojiOpen && (
            <div className="neo-emoji-panel">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => addEmoji(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="neo-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Прикрепить файл"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Введите сообщение..."
          rows={1}
          className="neo-input"
        />

        <button
          type="button"
          className="neo-btn neo-send"
          onClick={send}
          disabled={!text.trim() || sending}
          title="Отправить"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} className="neo-hidden" />
      </div>
    </div>
  );

  if (embedded) {
    return <div className="neo-chat-window-wrap">{content}</div>;
  }

  return (
    <div className="container chat-page-full">
      <div className="neo-chat-window-wrap">
        <button className="neo-btn neo-btn-ghost" onClick={() => navigate('chat')}>
          Назад к чатам
        </button>
        {content}
      </div>
    </div>
  );
}

export default ChatWindow;
