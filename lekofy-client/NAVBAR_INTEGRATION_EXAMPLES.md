/**
 * ПРИМЕР: Обновление Navbar для добавления ссылки на форму добавления объявления
 * 
 * Этот файл содержит примеры кода для обновления существующих компонентов
 */

// ============================================
// ПРИМЕР 1: Обновление существующего Navbar.jsx
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <i className="fas fa-car"></i> Lekofy
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            <i className="fas fa-home"></i> Главная
          </Link>
          
          {/* НОВАЯ ССЫЛКА */}
          <Link to="/add-car" className="nav-link nav-link-primary">
            <i className="fas fa-plus-circle"></i> Добавить объявление
          </Link>
          
          <Link to="/favorites" className="nav-link">
            <i className="fas fa-heart"></i> Избранное
          </Link>
          
          <Link to="/chat" className="nav-link">
            <i className="fas fa-comments"></i> Сообщения
          </Link>
          
          <Link to="/profile" className="nav-link">
            <i className="fas fa-user"></i> Профиль
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// ============================================
// ПРИМЕР 2: CSS для выделения кнопки "Добавить"
// ============================================

/*
.nav-link-primary {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white !important;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2);
}

.nav-link-primary:hover {
  background: linear-gradient(135deg, #1e3a8a 0%, #0f2644 100%);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
  transform: translateY(-2px);
}

.nav-link-primary i {
  margin-right: 6px;
}
*/

// ============================================
// ПРИМЕР 3: Мобильная версия с меню-бургер
// ============================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const NavbarMobile = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar-mobile">
      <div className="navbar-mobile-header">
        <Link to="/" className="navbar-logo">
          <i className="fas fa-car"></i> Lekofy
        </Link>
        
        <button className="menu-toggle" onClick={toggleMenu}>
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>

      {isOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
            <i className="fas fa-home"></i> Главная
          </Link>
          
          {/* НОВАЯ ССЫЛКА */}
          <Link to="/add-car" className="nav-link nav-link-primary" onClick={() => setIsOpen(false)}>
            <i className="fas fa-plus-circle"></i> Добавить объявление
          </Link>
          
          <Link to="/favorites" className="nav-link" onClick={() => setIsOpen(false)}>
            <i className="fas fa-heart"></i> Избранное
          </Link>
          
          <Link to="/chat" className="nav-link" onClick={() => setIsOpen(false)}>
            <i className="fas fa-comments"></i> Сообщения
          </Link>
          
          <Link to="/profile" className="nav-link" onClick={() => setIsOpen(false)}>
            <i className="fas fa-user"></i> Профиль
          </Link>
        </div>
      )}
    </nav>
  );
};

export default NavbarMobile;

// ============================================
// ПРИМЕР 4: Плавающая кнопка (FAB - Floating Action Button)
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/FloatingActionButton.css';

const FloatingActionButton = () => {
  return (
    <Link to="/add-car" className="fab">
      <i className="fas fa-plus"></i>
      <span className="fab-tooltip">Добавить объявление</span>
    </Link>
  );
};

export default FloatingActionButton;

// ============================================
// ПРИМЕР 5: CSS для плавающей кнопки (FAB)
// ============================================

/*
.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  z-index: 100;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(30, 64, 175, 0.6);
}

.fab-tooltip {
  position: absolute;
  right: 80px;
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.fab:hover .fab-tooltip {
  opacity: 1;
}

@media (max-width: 768px) {
  .fab {
    width: 56px;
    height: 56px;
    bottom: 16px;
    right: 16px;
  }
}
*/

// ============================================
// ПРИМЕР 6: Использование FloatingActionButton
// ============================================

import React from 'react';
import Navbar from './components/Navbar';
import FloatingActionButton from './components/FloatingActionButton';

function App() {
  return (
    <>
      <Navbar />
      {/* Ваше содержимое */}
      <FloatingActionButton />
    </>
  );
}

export default App;

// ============================================
// ПРИМЕР 7: Диалог подтверждения перед уходом
// ============================================

import { useEffect } from 'react';
import { useBeforeUnload } from 'react-router-dom';

const AddCarForm = () => {
  const [hasChanges, setHasChanges] = useState(false);

  useBeforeUnload(
    useCallback(() => {
      if (hasChanges) {
        return true;
      }
    }, [hasChanges])
  );

  // ... остальной код компонента
};

// ============================================
// ПРИМЕР 8: Индикатор процесса (если форма многошаговая)
// ============================================

const AddCarFormMultiStep = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  return (
    <div className="add-car-container">
      {/* Progress bar */}
      <div className="progress-bar">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`progress-step ${currentStep > i ? 'completed' : ''} ${currentStep === i + 1 ? 'active' : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Шаг 1: Основная информация */}
      {currentStep === 1 && (
        <div className="form-step">
          {/* Форма шага 1 */}
        </div>
      )}

      {/* Шаги 2-4 */}

      {/* Навигация */}
      <div className="form-navigation">
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
        >
          ← Назад
        </button>

        <button
          onClick={() => setCurrentStep(currentStep + 1)}
          disabled={currentStep === totalSteps}
        >
          Далее →
        </button>

        {currentStep === totalSteps && (
          <button onClick={handleSubmit} className="btn-primary">
            Опубликовать
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// ПРИМЕР 9: Обновленный App.jsx с полной навигацией
// ============================================

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingActionButton from './components/FloatingActionButton';

// Pages
import Home from './pages/Home';
import AddCar from './pages/AddCar';
import AdDetail from './pages/AdDetail';
import Favorites from './pages/Favorites';
import ChatList from './pages/ChatList';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверить авторизацию пользователя
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        
        {/* Защищенные маршруты */}
        <Route
          path="/add-car"
          element={user ? <AddCar /> : <Navigate to="/login" />}
        />
        <Route
          path="/favorites"
          element={user ? <Favorites /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={user ? <ChatList /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile user={user} /> : <Navigate to="/login" />}
        />
        
        {/* Открытые маршруты */}
        <Route path="/ad/:id" element={<AdDetail />} />
      </Routes>
      
      {/* Плавающая кнопка (опционально) */}
      {user && <FloatingActionButton />}
    </Router>
  );
}

export default App;

// ============================================
// ПРИМЕР 10: Environment переменные для разных серверов
// ============================================

// .env.development
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Lekofy Dev

// .env.production
VITE_API_URL=https://api.lekofy.com
VITE_APP_NAME=Lekofy

// .env.staging
VITE_API_URL=https://staging-api.lekofy.com
VITE_APP_NAME=Lekofy Staging

// Использование:
const API_URL = import.meta.env.VITE_API_URL;

export default API_URL;

// ============================================
// ИТОГО: Что обновить для полной интеграции:
// ============================================

/*
1. ✓ Добавить нужные компоненты в папку src/components/
2. ✓ Добавить новые страницы в папку src/pages/
3. Обновить src/App.jsx с новыми маршрутами
4. Обновить компонент Navbar для добавления ссылки на /add-car
5. Обновить AddCarForm.jsx для отправки данных на API
6. Протестировать все функции
7. Развернуть на production
*/
