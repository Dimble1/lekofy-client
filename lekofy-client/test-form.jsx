// Тестовый файл для проверки формы добавления автомобиля
// Запустите этот файл в браузере: http://localhost:5174/test-form.html

import React from 'react';
import ReactDOM from 'react-dom/client';
import AddCarForm from './components/AddCarForm';
import './styles/AddCarForm.css';

const TestForm = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Тест формы добавления автомобиля</h1>
      <p>Если форма отображается корректно, значит все работает!</p>
      <AddCarForm />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TestForm />);