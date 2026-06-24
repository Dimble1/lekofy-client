import { useCallback, useEffect, useMemo, useState } from 'react';
import { chatAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingAnimation from '../components/LoadingAnimation.jsx';
import chatEmptyIllustration from '../assets/chat-empty.svg';
import ChatWindow from './ChatWindow.jsx';

function ChatList({ initialChatId, initialTitle, initialProfileUserId, initialProfileName }) {
  const { isLoggedIn, user } = useAuth();
  const { navigate } = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeChat, setActiveChat] = useState(null);

  const formatTime = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const isActiveChatByTime = (chat) => {
    const source = chat.lastMessage?.createdAt || chat.updatedAt || chat.createdAt;
    if (!source) return false;
    const ageMs = Date.now() - new Date(source).getTime();
    return ageMs < 1000 * 60 * 60 * 24;
  };

  const getCounterparty = useCallback((chat) => {
    if (!user?.id) return null;
    return Number(chat.buyerId) === Number(user.id) ? chat.Seller : chat.Buyer;
  }, [user?.id]);

  const mapChatMeta = useCallback((chat) => {
    const counterparty = getCounterparty(chat);
    const title = counterparty?.name || chat.Ad?.title || `Чат #${chat.id}`;
    return {
      chatId: chat.id,
      adId: chat.Ad?.id,
      title,
      profileUserId: counterparty?.id,
      profileName: counterparty?.name,
    };
  }, [getCounterparty]);

  const loadChats = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const data = await chatAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setChats(list);

      setActiveChat((previous) => {
        const initialId = initialChatId ? Number(initialChatId) : null;

        if (initialId) {
          const exact = list.find((chat) => Number(chat.id) === initialId);
          if (exact) return mapChatMeta(exact);
          return {
            chatId: initialId,
            adId: null,
            title: initialTitle || `Чат #${initialId}`,
            profileUserId: initialProfileUserId,
            profileName: initialProfileName,
          };
        }

        if (previous?.chatId) {
          const current = list.find((chat) => Number(chat.id) === Number(previous.chatId));
          if (current) return mapChatMeta(current);
        }

        return list.length ? mapChatMeta(list[0]) : null;
      });
    } catch (e) {
      setError(e.message || 'Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  }, [initialChatId, initialProfileName, initialProfileUserId, initialTitle, mapChatMeta]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    loadChats();
  }, [isLoggedIn, navigate, loadChats]);

  const visibleChats = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return chats.filter((chat) => {
      const meta = mapChatMeta(chat);
      const lastMessage = chat.lastMessage?.text || chat.lastMessage?.content || '';
      const bySearch = !normalized || `${meta.title} ${lastMessage}`.toLowerCase().includes(normalized);

      if (!bySearch) return false;
      if (filterType === 'unread') return Number(chat.unreadCount || 0) > 0;
      if (filterType === 'active') return isActiveChatByTime(chat);
      return true;
    });
  }, [chats, filterType, mapChatMeta, searchQuery]);

  if (!isLoggedIn) return null;

  return (
    <div className="container chat-page-full">
      <div className="neo-chat-shell">
        <div className="neo-chat-list-wrap">
          <div className="neo-chat-topbar">
            <div>
              <h2 className="neo-chat-title">Сообщения</h2>
              <p className="neo-chat-subtitle">Один экран: список и диалог.</p>
            </div>
          </div>

          <div className="neo-chat-search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск чатов..."
            />
          </div>

          <div className="neo-chat-filters">
            <button type="button" className={`neo-chip ${filterType === 'all' ? 'on' : ''}`} onClick={() => setFilterType('all')}>Все</button>
            <button type="button" className={`neo-chip ${filterType === 'unread' ? 'on' : ''}`} onClick={() => setFilterType('unread')}>Непрочитанные</button>
            <button type="button" className={`neo-chip ${filterType === 'active' ? 'on' : ''}`} onClick={() => setFilterType('active')}>Активные</button>
          </div>

          {loading && <LoadingAnimation message="Загружаем чаты..." hint="Поднимаем список диалогов" />}
          {error && <div className="empty">{error}</div>}

          {!loading && !error && !visibleChats.length && (
            <div className="empty chat-empty">
              <img src={chatEmptyIllustration} alt="Пустой список чатов" className="chat-empty-svg" />
              <div>Чаты не найдены</div>
            </div>
          )}

          {!loading && !error && visibleChats.length > 0 && (
            <div className="neo-chat-list">
              {visibleChats.map((chat) => {
                const meta = mapChatMeta(chat);
                const lastMessage = chat.lastMessage?.text || chat.lastMessage?.content || 'Нажмите, чтобы открыть чат';
                const time = formatTime(chat.lastMessage?.createdAt || chat.updatedAt || chat.createdAt);
                const unreadCount = Number(chat.unreadCount || 0);
                const selected = Number(activeChat?.chatId) === Number(chat.id);

                return (
                  <div
                    key={chat.id}
                    className={`neo-chat-item ${selected ? 'on' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveChat(meta);
                      navigate('chat', meta);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveChat(meta);
                        navigate('chat', meta);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="neo-chat-avatar neo-chat-avatar-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (meta.profileUserId) {
                          navigate('profile', { userId: meta.profileUserId });
                        }
                      }}
                      title={meta.profileUserId ? 'Открыть профиль' : 'Профиль недоступен'}
                      disabled={!meta.profileUserId}
                    >
                      {meta.title.charAt(0).toUpperCase()}
                    </button>
                    <div className="neo-chat-body">
                      <div className="neo-chat-row1">
                        <span className="neo-chat-name">{meta.title}</span>
                        {time && <span className="neo-chat-time">{time}</span>}
                      </div>
                      <div className="neo-chat-row2">
                        <span className="neo-chat-preview">{lastMessage}</span>
                        {unreadCount > 0 && <span className="neo-chat-badge">{unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="neo-chat-main-col">
          {activeChat ? (
            <ChatWindow
              chatId={activeChat.chatId}
              adId={activeChat.adId}
              title={activeChat.title}
              profileUserId={activeChat.profileUserId}
              profileName={activeChat.profileName}
              embedded
            />
          ) : (
            <div className="neo-window neo-chat-placeholder">
              <div className="empty">Выберите чат слева</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatList;
