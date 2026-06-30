import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import '../styles/Auth.css';

const KG_PHONE_CODE = '+996';

const formatKgPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const localDigits = digits.startsWith('996') ? digits.slice(3) : digits;
  return `${KG_PHONE_CODE}${localDigits.slice(0, 9)}`;
};

function Register() {
  const { register, requestSmsCode, error } = useAuth();
  const { navigate } = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);

  const normalizedPhone = useMemo(() => phone.replace(/[^\d+]/g, ''), [phone]);
  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  useEffect(() => {
    if (!resendAfter) return undefined;

    const timer = window.setInterval(() => {
      setResendAfter((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendAfter]);

  const clearError = () => setLocalError('');

  const handleSendSms = async () => {
    clearError();

    if (!name.trim() || !normalizedPhone || !password || !confirmPassword) {
      setLocalError('Заполните обязательные поля');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      setLocalError('Пароль: минимум 8 символов, 1 заглавная буква, 1 цифра и 1 спецсимвол');
      return;
    }

    setSmsLoading(true);
    try {
      const result = await requestSmsCode(normalizedPhone, 'register');
      if (!result || result.success === false) {
        setLocalError(result?.error || 'Не удалось отправить SMS');
        return;
      }

      setChallengeId(result.challengeId || '');
      setSmsSent(true);
      setResendAfter(Number(result.resendAfter || 30));
    } finally {
      setSmsLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    clearError();

    if (!challengeId || !smsCode) {
      setLocalError('Введите код из SMS');
      return;
    }

    setLoading(true);
    try {
      const result = await register(
        name.trim(),
        '',
        password,
        normalizedPhone,
        confirmPassword,
        challengeId,
        smsCode.trim(),
      );

      if (!result.success) {
        setLocalError(result.error || 'SMS подтверждено, но регистрация не выполнена');
        return;
      }

      navigate('home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <button type="button" className="auth-brand" onClick={() => navigate('home')}>
          <img src="/lekofy-logo.svg" alt="Lekofy" className="auth-brand-logo" />
        </button>

        <div className="auth-topnav">
          <button type="button" onClick={() => navigate('login')}>
            Войти
          </button>
          <button type="button" className="is-primary" onClick={() => navigate('home')}>
            Смотреть объявления
          </button>
        </div>
      </div>

      <section className="auth-shell auth-shell--single">
        <section className="auth-card">
          <div className="auth-card-header">
            <div>
              <p className="auth-card-kicker">Создание аккаунта</p>
              <h2>Регистрация в Lekofy</h2>
              <p className="auth-card-subtitle">
                Заполните поля, получите SMS-код и завершите создание профиля.
              </p>
            </div>
            <button type="button" className="auth-close" onClick={() => navigate('home')}>
              ×
            </button>
          </div>

          <form className="auth-form" onSubmit={smsSent ? handleRegister : handleSendSms}>
            <div className="auth-field">
              <label htmlFor="name">Имя</label>
              <input
                id="name"
                className="auth-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="phone">Телефон</label>
              <input
                id="phone"
                className="auth-input"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(formatKgPhone(e.target.value));
                  setChallengeId('');
                  setSmsSent(false);
                  setSmsCode('');
                  setResendAfter(0);
                }}
                placeholder="+996700000000"
                autoComplete="tel"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
              />
              {password && (
                <div className="password-strength">
                  <div className="password-strength__bar">
                    <div
                      className="password-strength__fill"
                      style={{ width: passwordStrength.width, background: passwordStrength.color }}
                    />
                  </div>
                  <div className="password-strength__label">{passwordStrength.label}</div>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                className="auth-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                autoComplete="new-password"
              />
            </div>

            {smsSent && (
              <div className="auth-field">
                <label htmlFor="smsCode">Код из SMS</label>
                <input
                  id="smsCode"
                  className="auth-input"
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="6-значный код"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
            )}

            {localError || error ? <div className="auth-alert is-error">{localError || error}</div> : null}

            <div className="auth-actions">
              <button type="submit" className="auth-submit" disabled={smsLoading || loading}>
                {smsSent
                  ? (loading ? 'Проверяем...' : 'Подтвердить и зарегистрироваться')
                  : (smsLoading ? 'Отправляем SMS...' : 'Получить SMS код')}
              </button>

              {smsSent && (
                <button
                  type="button"
                  className="auth-secondary"
                  onClick={handleSendSms}
                  disabled={smsLoading || resendAfter > 0}
                >
                  {resendAfter > 0 ? `Повтор через ${resendAfter}с` : 'Отправить новый код'}
                </button>
              )}
            </div>
          </form>

          {smsSent && resendAfter > 0 && (
            <div className="auth-resend">Можно запросить новый код через {resendAfter} секунд.</div>
          )}

          <div className="auth-footer">
            Уже есть аккаунт?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('login')}>
              Войти
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Register;
