import { useEffect, useMemo, useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { getFirebaseAuth } from '../services/firebase.js';
import '../styles/Register.css';

function mapFirebaseError(err) {
  const code = err?.code || '';
  const message = err?.message || 'Неизвестная ошибка';

  const dictionary = {
    'auth/invalid-phone-number': 'Неверный формат номера. Используйте международный формат, например +996700000000.',
    'auth/too-many-requests': 'Слишком много попыток. Подождите немного и попробуйте снова.',
    'auth/captcha-check-failed': 'Проверка reCAPTCHA не пройдена. Обновите страницу и попробуйте снова.',
    'auth/quota-exceeded': 'Превышена SMS-квота Firebase для проекта.',
    'auth/network-request-failed': 'Проблема сети. Проверьте интернет и доступ к сервисам Google.',
    'auth/app-not-authorized': 'Текущий домен не разрешен в Firebase Authentication.',
    'auth/invalid-verification-code': 'Неверный код из SMS.',
    'auth/code-expired': 'Срок действия SMS-кода истек. Запросите новый код.',
  };

  return dictionary[code] || `${message}${code ? ` (${code})` : ''}`;
}

function Register() {
  const { register, error } = useAuth();
  const { navigate } = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  const normalizedPhone = useMemo(() => phone.replace(/[^\d+]/g, ''), [phone]);

  const initRecaptcha = async (auth) => {
    if (window.recaptchaVerifier) return window.recaptchaVerifier;

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'phone-recaptcha', {
      size: 'normal',
      callback: () => {},
    });

    await window.recaptchaVerifier.render();
    return window.recaptchaVerifier;
  };

  const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleSendSms = async () => {
    if (!name || !normalizedPhone || !password || !confirmPassword) {
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
    setLocalError('');

    try {
      const auth = getFirebaseAuth();
      const verifier = await initRecaptcha(auth);
      const result = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
      setConfirmationResult(result);
      setSmsSent(true);
    } catch (err) {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setLocalError(mapFirebaseError(err));
    } finally {
      setSmsLoading(false);
    }
  };

  const handlePhoneRegister = async (e) => {
    e.preventDefault();

    if (!confirmationResult || !smsCode) {
      setLocalError('Введите код из SMS');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      await confirmationResult.confirm(smsCode);
      const authRes = await register(
        name.trim(),
        '',
        password,
        normalizedPhone,
        confirmPassword,
      );

      if (!authRes.success) {
        setLocalError(authRes.error || 'SMS подтверждено, но регистрация не выполнена');
        return;
      }

      navigate('home');
    } catch (err) {
      setLocalError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  return (
    <div className="container register-page">
      <div className="register-card">
        <div className="register-side-art" aria-hidden="true">
          <svg viewBox="0 0 420 420" role="img">
            <defs>
              <linearGradient id="regGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <circle cx="210" cy="210" r="180" fill="url(#regGradient)" opacity="0.2" />
            <path
              d="M130 130h160a22 22 0 0 1 22 22v116a22 22 0 0 1-22 22H130a22 22 0 0 1-22-22V152a22 22 0 0 1 22-22z"
              fill="#ffffff"
            />
            <path d="M150 170h120v16H150zm0 38h120v16H150zm0 38h74v16h-74z" fill="#93c5fd" />
            <circle cx="286" cy="246" r="28" fill="#22d3ee" />
            <path d="M278 248l6 6 12-14" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
          <h3>Безопасная регистрация</h3>
          <p>Подтвердите номер телефона через SMS и войдите в один шаг.</p>
        </div>

        <div className="form-container register-form-shell">
          <h2>Регистрация</h2>
          <form onSubmit={handlePhoneRegister} className="modal-form">
            <label>
              Имя
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
              />
            </label>
            <label>
              Телефон
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+996700000000"
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Мин. 8, 1 заглавная, 1 цифра, 1 символ"
              />
            </label>
            <label>
              Подтвердите пароль
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
              />
            </label>

            {!smsSent && <div id="phone-recaptcha" className="register-recaptcha" />}

            {!smsSent ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={smsLoading}
                onClick={handleSendSms}
                style={{ width: '100%' }}
              >
                {smsLoading ? 'Отправка SMS...' : 'Получить SMS код'}
              </button>
            ) : (
              <>
                <label>
                  Код из SMS
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="6-значный код"
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Проверка...' : 'Подтвердить и зарегистрироваться'}
                </button>
              </>
            )}

            {(localError || error) && <p className="register-error">{localError || error}</p>}
          </form>

          <div style={{ marginTop: 8, fontSize: 13, textAlign: 'center' }}>
            Уже есть аккаунт?{' '}
            <button type="button" className="modal-switch" onClick={() => navigate('login')}>
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
