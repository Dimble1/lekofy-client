import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import '../styles/Auth.css';

const KG_PHONE_CODE = '+996';

const formatKgPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const localDigits = digits.startsWith('996') ? digits.slice(3) : digits;
  return `${KG_PHONE_CODE}${localDigits.slice(0, 9)}`;
};

function Login() {
  const { login, requestPasswordResetCode, verifySmsCode, resetPassword, error } = useAuth();
  const { navigate } = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');

  const [resetPhone, setResetPhone] = useState('');
  const [resetChallengeId, setResetChallengeId] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetStep, setResetStep] = useState('request');
  const [resetCodeVerified, setResetCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [localError, setLocalError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);

  useEffect(() => {
    if (!resendAfter) return undefined;

    const timer = window.setInterval(() => {
      setResendAfter((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendAfter]);

  const clearMessages = () => {
    setLocalError('');
    setStatusMessage('');
  };

  const switchMode = (nextMode) => {
    setIsResetMode(nextMode === 'reset');
    clearMessages();
  };

  const normalizeLoginValue = (value) => {
    const trimmed = String(value || '').trim();
    return formatKgPhone(trimmed);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!loginValue.trim() || !password) {
      setLocalError('Введите номер телефона и пароль');
      return;
    }

    setLoading(true);
    try {
      const result = await login(normalizeLoginValue(loginValue), password);
      if (!result.success) {
        setLocalError(result.error || 'Не удалось войти');
        return;
      }

      navigate('home');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!resetPhone.trim()) {
      setLocalError('Введите номер телефона');
      return;
    }

    setRequestingCode(true);
    try {
      const result = await requestPasswordResetCode(resetPhone.trim());
      if (!result || result.success === false) {
        setLocalError(result?.error || 'Не удалось отправить SMS');
        return;
      }

      setResetChallengeId(result.challengeId || '');
      setResendAfter(Number(result.resendAfter || 30));
      setStatusMessage('Код отправлен по SMS');
      setResetCode('');
      setResetCodeVerified(false);
      setResetStep('code');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleVerifyResetCode = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!resetChallengeId) {
      setLocalError('Сначала запросите SMS-код');
      return;
    }

    if (resetCode.trim().length !== 6) {
      setLocalError('Введите 6-значный код из SMS');
      return;
    }

    setRequestingCode(true);
    try {
      const result = await verifySmsCode(
        resetChallengeId,
        resetPhone.trim(),
        resetCode.trim(),
        'reset_password',
      );

      if (!result.success) {
        setLocalError(result.error || 'Не удалось подтвердить код');
        return;
      }

      setResetCodeVerified(true);
      setResetStep('password');
      setStatusMessage('Код подтвержден');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!resetChallengeId) {
      setLocalError('Сначала запросите SMS-код');
      return;
    }

    if (!resetCodeVerified) {
      setLocalError('Сначала подтвердите SMS-код');
      return;
    }

    if (!resetPhone.trim() || !resetCode.trim() || !newPassword || !confirmNewPassword) {
      setLocalError('Заполните все поля');
      return;
    }

    setResettingPassword(true);
    try {
      const result = await resetPassword(
        resetPhone.trim(),
        resetChallengeId,
        resetCode.trim(),
        newPassword,
        confirmNewPassword,
      );

      if (!result.success) {
        setLocalError(result.error || 'Не удалось обновить пароль');
        return;
      }

      navigate('home');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <button type="button" className="auth-brand" onClick={() => navigate('home')}>
          <img src="/lekofy-logo.svg" alt="Lekofy" className="auth-brand-logo" />
        </button>

        <div className="auth-topnav">
          <button type="button" onClick={() => navigate('home')}>
            На главную
          </button>
          <button type="button" className="is-primary" onClick={() => navigate('register')}>
            Регистрация
          </button>
        </div>
      </div>

      <section className="auth-shell auth-shell--single">
        <section className="auth-card">
          <div className="auth-card-header">
            <div>
              <p className="auth-card-kicker">Вход в аккаунт</p>
              <h2>{isResetMode ? 'Восстановить пароль' : 'Войти в Lekofy'}</h2>
              <p className="auth-card-subtitle">
                {isResetMode
                  ? 'Сначала получите и проверьте SMS-код, потом задайте новый пароль.'
                  : 'Используйте номер телефона и пароль.'}
              </p>
            </div>
            <button type="button" className="auth-close" onClick={() => navigate('home')}>
              ×
            </button>
          </div>

          {!isResetMode ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label htmlFor="loginValue">Номер телефона</label>
                <input
                  id="loginValue"
                  className="auth-input"
                  type="text"
                  value={loginValue}
                  onChange={(e) => setLoginValue(formatKgPhone(e.target.value))}
                  placeholder="+996507000000"
                  autoComplete="tel"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="passwordInput">Пароль</label>
                <div className="auth-input-wrap">
                  <input
                    id="passwordInput"
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ваш пароль"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
              </div>

              <div className="auth-helper-row">
                <button type="button" className="auth-link" onClick={() => switchMode('reset')}>
                  Забыли пароль?
                </button>
              </div>

              {localError || error ? (
                <div className="auth-alert is-error">{localError || error}</div>
              ) : null}

              <div className="auth-actions">
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Входим...' : 'Войти'}
                </button>
              </div>
            </form>
          ) : (
            <form
              className="auth-form auth-sms-stack"
              onSubmit={
                resetStep === 'request'
                  ? handleRequestResetCode
                  : resetStep === 'code'
                    ? handleVerifyResetCode
                    : handleResetPassword
              }
            >
              <div className="auth-field">
                <label htmlFor="resetPhone">Номер телефона</label>
                <input
                  id="resetPhone"
                  className="auth-input"
                  type="tel"
                  value={resetPhone}
                  onChange={(e) => {
                    setResetPhone(formatKgPhone(e.target.value));
                    setResetChallengeId('');
                    setResetCode('');
                    setStatusMessage('');
                    setResendAfter(0);
                    setResetCodeVerified(false);
                    setResetStep('request');
                  }}
                  placeholder="+996507000000"
                  autoComplete="tel"
                />
              </div>

              {resetChallengeId && resetStep !== 'request' && (
                <div className="auth-field">
                  <label htmlFor="resetCode">Код из SMS</label>
                  <input
                    id="resetCode"
                    className="auth-input"
                    type="text"
                    inputMode="numeric"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              )}

              {resetStep === 'password' && resetCodeVerified && (
                <>
                  <div className="auth-field">
                    <label htmlFor="newPassword">Новый пароль</label>
                    <input
                      id="newPassword"
                      className="auth-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 8 символов"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="confirmNewPassword">Повторите пароль</label>
                    <input
                      id="confirmNewPassword"
                      className="auth-input"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {localError || error ? (
                <div className="auth-alert is-error">{localError || error}</div>
              ) : null}
              {statusMessage ? <div className="auth-alert is-success">{statusMessage}</div> : null}

              <div className="auth-actions">
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={requestingCode || resettingPassword}
                >
                  {resetStep === 'request'
                    ? (requestingCode ? 'Отправляем...' : 'Получить SMS код')
                    : resetStep === 'code'
                      ? (requestingCode ? 'Проверяем...' : 'Проверить код')
                      : (resettingPassword ? 'Сохраняем...' : 'Сменить пароль')}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Нет аккаунта?{' '}
            <button type="button" className="auth-link" onClick={() => navigate('register')}>
              Зарегистрироваться
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Login;
