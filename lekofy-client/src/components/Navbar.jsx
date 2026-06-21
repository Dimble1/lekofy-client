import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { notificationsAPI } from '../services/api';

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="currentColor" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 22a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 3 3zm8-6h-1V11a7 7 0 0 0-14 0v5H4a1 1 0 0 0-.117 1.993L4 18h16a1 1 0 0 0 .117-1.993L20 16z" fill="currentColor" />
  </svg>
);

function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const { navigate } = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUnread = async () => {
      if (!isLoggedIn) {
        if (isMounted) setUnreadCount(0);
        return;
      }

      try {
        const data = await notificationsAPI.getMine();
        if (isMounted) {
          setUnreadCount(Number(data?.unreadCount || 0));
        }
      } catch {
        if (isMounted) setUnreadCount(0);
      }
    };

    loadUnread();
    const intervalId = setInterval(loadUnread, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  const handleCreateClick = () => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }
    navigate('publish');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="logo" onClick={() => navigate('home')}>
          <span className="brand-logo-shell">
            <img src="/lekofy-logo.svg" alt="Lekofy" className="brand-logo-image" />
            <span className="brand-wordmark">Lekofy</span>
          </span>
        </div>

        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <button className="btn btn-secondary" onClick={() => navigate('favorites')}>
                Избранное
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('my-ads')}>
                Мои объявления
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('chat')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ChatIcon />
                Чаты
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('notifications')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <BellIcon />
                Уведомления{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('profile', { userId: user?.id })}>
                {user?.name || 'Профиль'}
              </button>
              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <button className="btn btn-secondary" onClick={() => navigate('admin')}>
                  Админ
                </button>
              )}
              <button className="btn btn-primary" onClick={handleCreateClick}>
                + Подать объявление
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  logout();
                  navigate('home');
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => navigate('login')}>
                Войти
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('register')}>
                Регистрация
              </button>
              <button className="btn btn-primary" onClick={handleCreateClick}>
                + Подать объявление
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
