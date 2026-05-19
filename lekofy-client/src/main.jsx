import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RouterProvider } from './context/RouterContext.jsx';

// Handle successful OAuth callback from backend:
// /auth/{provider}/success?token=...&user=...
const url = new URL(window.location.href);
if (url.pathname === '/auth/google/success') {
  const token = url.searchParams.get('token');
  const userParam = url.searchParams.get('user');
  if (token && userParam) {
    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.error('Ошибка разбора пользователя OAuth:', e);
    }
  }
  window.history.replaceState({}, '', '/');
  window.location.reload();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </RouterProvider>
  </StrictMode>,
);
