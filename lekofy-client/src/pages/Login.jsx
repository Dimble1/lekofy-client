import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

function Login() {
  const { login, error } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email.trim() || !password) {
      setLocalError('Введите email и пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setLocalError(res.error || 'Не удалось войти');
        return;
      }
      navigate('home');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/google`;
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="form-container">
        <h2>Войти в Lekofy</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ваш пароль"
            />
          </label>
          {(localError || error) && (
            <p style={{ color: 'red', fontSize: 13 }}>
              {localError || error}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGoogleLogin}
              style={{ width: '100%', marginTop: '10px', backgroundColor: '#4285f4', color: 'white', border: 'none' }}
            >
              <i className="fab fa-google" style={{ marginRight: '8px' }}></i>
              Войти через Google
            </button>
          </div>
        </form>
        <div style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
          Нет аккаунта?{' '}
          <button
            type="button"
            className="modal-switch"
            onClick={() => navigate('register')}
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
