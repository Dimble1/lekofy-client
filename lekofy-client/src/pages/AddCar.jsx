// Пример: AddCar.jsx страница для демонстрации формы
// Поместите этот файл в папку: src/pages/AddCar.jsx

import React from 'react';
import AddCarForm from '../components/AddCarForm';
import '../styles/AddCar.css';

const AddCar = () => {
  return (
    <div className="add-car-page">
      <div className="container">
        <AddCarForm />
      </div>
    </div>
  );
};

export default AddCar;
