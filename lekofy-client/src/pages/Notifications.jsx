import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationsAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function Notifications() {
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await notificationsAPI.getMine();
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (e) {
      setError(e.message || 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.reduce((sum, item) => sum + (item?.isRead ? 0 : 1), 0),
    [items],
  );

  const openItem = async (item) => {
    if (!item?.isRead) {
      try {
        await notificationsAPI.markAsRead(item.id);
      } catch {
        // noop
      }
    }

    if (item?.data?.chatId) {
      navigate('chat-window', { chatId: item.data.chatId });
      return;
    }

    if (item?.data?.adId) {
      navigate('ad-detail', { id: item.data.adId });
    }
  };

  const markAll = async () => {
    await notificationsAPI.markAllAsRead();
    await load();
  };

  if (!isLoggedIn) return null;

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Уведомления</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#666' }}>Непрочитанных: {unreadCount}</span>
          <button className="btn btn-secondary" onClick={markAll} disabled={!unreadCount}>Прочитать все</button>
        </div>
      </div>

      {loading && <div className="loading">Загрузка...</div>}
      {!loading && error && <div className="empty">{error}</div>}

      {!loading && !error && !items.length && <div className="empty">Пока нет уведомлений.</div>}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openItem(item)}
              className="btn btn-secondary"
              style={{
                textAlign: 'left',
                borderColor: item.isRead ? '#e5e7eb' : '#0ea5e9',
                background: item.isRead ? '#fff' : '#f0f9ff',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 14, color: '#334155', marginBottom: 6 }}>{item.text}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {new Date(item.createdAt).toLocaleString('ru-RU')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
