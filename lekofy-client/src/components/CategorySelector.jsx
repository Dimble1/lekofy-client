import React from 'react';
import { categories } from '../data/categories';
import '../styles/CategorySelector.css';

const CategorySelector = ({ onSelect }) => {
  return (
    <div className="category-selector-container">
      <h1>Выберите категорию объявления</h1>
      <div className="category-grid">
        {categories.map(cat => (
          <button
            key={cat.id}
            className="category-card"
            onClick={() => onSelect(cat)}
          >
            <i className={`fas ${cat.icon} category-icon`}></i>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
