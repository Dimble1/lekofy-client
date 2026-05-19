import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import chatEmptyIllustration from '../assets/chat-empty.svg';

const QUICK_REPLIES = ['Здравствуйте! Товар еще в наличии?', 'Можно немного уступить по цене?', 'Когда сможете отправить?', 'Можно фото/видео вживую?'];
const EMOJIS = ['🙂', '👍', '🔥', '🙏', '✅', '😎', '🤝', '💬'];

function ChatWindow({ chatId, title, profileUserId, profileName, embedded = false }) {
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
  const intervalRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const typingStopRef = useRef(null);
  const supportsReadRef = useRef(true);
  const supportsTypingRef = useRef(true);
  const messagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const menuPanelRef = useRef(null);

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

        const hasUnreadFromOther = list.some((msg) => Number(msg.senderId) !== Number(user?.id) && !msg.isRead);
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

  useEffect(() => () => {
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    if (chatId && supportsTypingRef.current) {
      chatAPI.setTyping(chatId, false).catch(() => {});
    }
  }, [chatId]);

  const filteredMessages = useMemo(() => {
    const q = messageQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((msg) => (msg.text || msg.content || '').toLowerCase().includes(q));
  }, [messages, messageQuery]);

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

  if (!isLoggedIn) return null;

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !chatId) return;

    try {
      setSending(true);
      await stopTyping();
      setText('');
      await chatAPI.sendMessage(chatId, trimmed);
      await loadMessages(false);
    } catch (e) {
      setError(e.message || 'Не удалось отправить сообщение');
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleQuickReply = (value) => {
    setText(value);
    if (value.trim()) pingTyping();
  };

  const addEmoji = (emoji) => {
    setText((prev) => {
      const next = `${prev}${emoji}`;
      if (next.trim()) pingTyping();
      return next;
    });
    setEmojiOpen(false);
  };

  const handleReport = () => {
    setMenuOpen(false);
    const reason = window.prompt('Опишите причину жалобы');
    if (!reason || !reason.trim()) return;
    alert('Жалоба отправлена модераторам.');
  };

  const handleBlock = () => {
    setMenuOpen(false);
    alert('Пользователь заблокирован.');
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
    chatAPI.sendImageMessage(chatId, file)
      .then(() => loadMessages(false))
      .catch((e) => setError(e.message || 'Не удалось отправить фото'))
      .finally(() => setSending(false));

    event.target.value = '';
  };

  const content = (
    <div className="neo-window">
      <div className="neo-window-header">
        <button
          type="button"
          className="neo-window-avatar neo-chat-avatar-btn"
          onClick={() => {
            if (profileUserId) navigate('profile', { userId: profileUserId });
          }}
          disabled={!profileUserId}
          title={profileUserId ? 'Открыть профиль' : 'Профиль недоступен'}
        >
          {(profileName || title || 'Чат').charAt(0).toUpperCase()}
        </button>
        <div className="neo-window-title-wrap">
          <button
            type="button"
            className="neo-profile-link"
            onClick={() => {
              if (profileUserId) navigate('profile', { userId: profileUserId });
            }}
            disabled={!profileUserId}
            title={profileUserId ? 'Перейти в профиль' : 'Профиль недоступен'}
          >
            {profileName || title || 'Чат'}
          </button>
          <div className="neo-window-status">{isOtherTyping ? 'печатает...' : 'в сети'}</div>
        </div>
        <div className="neo-window-actions">
          <button type="button" className="neo-icon-btn" onClick={() => setSearchOpen((v) => !v)} title="Поиск по сообщениям">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
          </button>
          <div className="neo-menu-wrap" ref={menuPanelRef}>
            <button type="button" className="neo-icon-btn" onClick={() => setMenuOpen((v) => !v)} title="Меню">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="19" cy="12" r="1.8" fill="currentColor" /></svg>
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

      {searchOpen && (
        <div className="neo-search-panel">
          <input
            type="text"
            value={messageQuery}
            onChange={(e) => setMessageQuery(e.target.value)}
            placeholder="Поиск по сообщениям..."
          />
        </div>
      )}

      <div className="neo-messages" ref={messagesRef}>
        {loading && <div className="loading">Загрузка...</div>}

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
            const mine = msg.senderId === user?.id;
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
                    <img className="neo-msg-image" src={imageUrl} alt="Фото в чате" />
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
        {QUICK_REPLIES.map((reply) => (
          <button key={reply} type="button" className="neo-chip" onClick={() => handleQuickReply(reply)}>
            {reply}
          </button>
        ))}
      </div>

      <div className="neo-input-wrap">
        <div className="neo-input-tools" ref={emojiPanelRef}>
          <button type="button" className="neo-icon-btn" onClick={() => setEmojiOpen((v) => !v)} title="Эмодзи">
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

        <button type="button" className="neo-icon-btn" onClick={() => fileInputRef.current?.click()} title="Прикрепить файл">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.44 11.05L12.25 20.24a5 5 0 0 1-7.07-7.07L13 5.35a3 3 0 0 1 4.24 4.24L9.41 17.41a1 1 0 0 1-1.41-1.41l7.07-7.07" /></svg>
        </button>

        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Введите сообщение..."
          rows={1}
          className="neo-input"
        />

        <button type="button" className="neo-btn neo-send" onClick={send} disabled={!text.trim() || sending} title="Отправить">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5L21 3l-6 18-3.5-7L3 11.5z" fill="currentColor" /></svg>
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
