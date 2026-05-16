import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

function Settings() {
  const { user, isLoggedIn } = useAuth();
  const { navigate } = useRouter();

  const [telegramStatus, setTelegramStatus] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramConfirmed, setTelegramConfirmed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const enabled = localStorage.getItem(`telegram_enabled_${user.id}`) === '1';
    const confirmed = localStorage.getItem(`telegram_confirmed_${user.id}`) === '1';
    setTelegramEnabled(enabled);
    setTelegramConfirmed(confirmed);
  }, [user?.id]);

  const handleConnectTelegram = () => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      setTelegramStatus('Telegram бот не настроен');
      return;
    }

    const idForLink = user?.id;
    const payload = idForLink ? `connect_${idForLink}` : 'connect';
    const link = `https://t.me/${botUsername}?start=${payload}`;
    window.open(link, '_blank', 'noopener,noreferrer');

    if (user?.id) {
      localStorage.setItem(`telegram_confirmed_${user.id}`, '1');
    }
    setTelegramConfirmed(true);
    setTelegramStatus('Telegram подтвержден');
  };

  const handleToggleTelegram = () => {
    const nextValue = !telegramEnabled;
    setTelegramEnabled(nextValue);
    if (user?.id) {
      localStorage.setItem(`telegram_enabled_${user.id}`, nextValue ? '1' : '0');
    }
    setTelegramStatus(nextValue ? 'Telegram включено' : 'Telegram выключено');
  };

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <p>Сначала войдите в аккаунт.</p>
        <button className="btn btn-primary" onClick={() => navigate('login')}>
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Настройки</h1>

      <section className="profile-side-card" style={{ maxWidth: 560 }}>
        <h3>Интеграции</h3>
        <div style={{ marginBottom: 10, color: '#c9c4d6' }}>
          Статус: {telegramEnabled ? 'включено' : 'выключено'} | Подтверждение: {telegramConfirmed ? 'подтверждено' : 'не подтверждено'}
        </div>

        <button className="profile-side-action" onClick={handleConnectTelegram}>
          Подключить Telegram
        </button>

        <button className="profile-side-action" onClick={handleToggleTelegram}>
          {telegramEnabled ? 'Выключить Telegram' : 'Включить Telegram'}
        </button>

        {telegramStatus && <div className="profile-share-status">{telegramStatus}</div>}
      </section>
    </div>
  );
}

export default Settings;
