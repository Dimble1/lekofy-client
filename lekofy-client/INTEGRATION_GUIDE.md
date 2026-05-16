/**
 * ПРИМЕРЫ ИНТЕГРАЦИИ КОМПОНЕНТА AddCarForm
 * 
 * Выберите один из вариантов ниже в зависимости от вашей структуры маршрутизации
 */

// ============================================
// ВАРИАНТ 1: React Router (рекомендуется)
// ============================================

// Создайте файл: src/main.jsx или обновите существующий

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// ============================================
// ВАРИАНТ 2: Конфигурация маршрутов
// ============================================

// Файл: src/routes.jsx

import Home from './pages/Home'
import AddCar from './pages/AddCar'
import Favorites from './pages/Favorites'
import ChatList from './pages/ChatList'
import Login from './pages/Login'
import Register from './pages/Register'

export const routes = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/add-car',
    element: <AddCar />,
    // Опционально: добавьте защиту маршрута
    // requireAuth: true
  },
  {
    path: '/favorites',
    element: <Favorites />
  },
  {
    path: '/chat',
    element: <ChatList />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }
]

// ============================================
// ВАРИАНТ 3: Context Router (если используется)
// ============================================

// Файл: src/context/RouterContext.jsx

import { useContext, createContext } from 'react'

export const RouterContext = createContext()

export const useRouter = () => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter должен использоваться внутри RouterProvider')
  }
  return context
}

// ============================================
// ВАРИАНТ 4: Использование в App.jsx
// ============================================

// Обновите App.jsx:

import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AddCar from './pages/AddCar'
import Favorites from './pages/Favorites'
import ChatList from './pages/ChatList'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-car" element={<AddCar />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  )
}

export default App

// ============================================
// ВАРИАНТ 5: Добавить кнопку в Navbar
// ============================================

// Обновите Navbar.jsx:

import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Lekofy
        </Link>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Главная</Link>
          <Link to="/add-car" className="nav-link">
            <i className="fas fa-plus"></i> Добавить объявление
          </Link>
          <Link to="/favorites" className="nav-link">
            <i className="fas fa-heart"></i> Избранное
          </Link>
          <Link to="/chat" className="nav-link">
            <i className="fas fa-comments"></i> Сообщения
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

// ============================================
// ВАРИАНТ 6: Интеграция с API
// ============================================

// Обновите AddCarForm.jsx - замените handleSubmit:

const handleSubmit = async (e) => {
  e.preventDefault()

  if (!validateForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  try {
    const formDataToSend = new FormData()
    
    // Добавить все поля формы
    Object.keys(formData).forEach(key => {
      if (key === 'images') {
        formData.images.forEach((image, index) => {
          formDataToSend.append(`images[${index}]`, image)
        })
      } else {
        formDataToSend.append(key, formData[key])
      }
    })

    // Отправить на сервер
    const response = await fetch('/api/ads/create', {
      method: 'POST',
      body: formDataToSend,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      alert('Объявление успешно создано!')
      // Перенаправить на страницу объявления или главную
      window.location.href = `/ad/${data.id}`
    } else {
      const errorData = await response.json()
      alert(`Ошибка: ${errorData.message || 'Невозможно создать объявление'}`)
    }
  } catch (error) {
    console.error('Ошибка при отправке формы:', error)
    alert('Ошибка при отправке формы. Попробуйте позже.')
  }
}

// ============================================
// ВАРИАНТ 7: ProtectedRoute (защита маршрута)
// ============================================

// Файл: src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

// Использование в App.jsx:

<Route 
  path="/add-car" 
  element={
    <ProtectedRoute isAuthenticated={!!user}>
      <AddCar />
    </ProtectedRoute>
  } 
/>

// ============================================
// ВАРИАНТ 8: Конфигурация для production
// ============================================

// Обновите vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom']
        }
      }
    }
  }
})

// ============================================
// ВАРИАНТ 9: Env переменные
// ============================================

// Файл: .env.local (не коммитьте в git!)

VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Lekofy

// Файл: .env.production

VITE_API_URL=https://api.lekofy.com
VITE_APP_NAME=Lekofy

// Использование:

const API_URL = import.meta.env.VITE_API_URL

const response = await fetch(`${API_URL}/ads/create`, {
  method: 'POST',
  body: formDataToSend
})

// ============================================
// ВАРИАНТ 10: Обработка ошибок (улучшенная)
// ============================================

// Файл: src/components/ErrorBoundary.jsx

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Произошла ошибка</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Попробовать снова
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Использование:

<ErrorBoundary>
  <AddCar />
</ErrorBoundary>

// ============================================
// УСТАНОВКА ЗАВИСИМОСТЕЙ (если нужны)
// ============================================

// npm install react-router-dom
// npm install axios  # для удобной работы с API

// ============================================
// ЗАПУСК ПРОЕКТА
// ============================================

// npm install          # установка зависимостей
// npm run dev          # разработка (Vite mode)
// npm run build        # сборка для production
// npm run preview      # просмотр production версии

// ============================================
// ТЕСТИРОВАНИЕ ФОРМЫ
// ============================================

// 1. Откройте приложение: http://localhost:5173
// 2. Перейдите на: /add-car
// 3. Заполните все поля
// 4. Загрузите фотографии
// 5. Нажмите "Опубликовать объявление"

// ============================================
// ТРУБЛШУТИНГ
// ============================================

// Problem: Иконки не отображаются
// Solution: Проверьте что Font Awesome подключена в index.html
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

// Problem: Стили не применяются
// Solution: Убедитесь что путь к CSS файлу корректный в импорте:
// import '../styles/AddCarForm.css'

// Problem: Формя не отправляется
// Solution: Проверьте в консоли браузера (F12 > Console) наличие ошибок

// Problem: Файлы не загружаются
// Solution: Проверьте размер файлов (макс 5МБ) и формат (JPG, PNG)
