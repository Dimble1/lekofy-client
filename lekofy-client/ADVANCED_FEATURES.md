/**
 * ДОПОЛНИТЕЛЬНЫЕ ПРИМЕРЫ И УЛУЧШЕНИЯ
 * 
 * Этот файл содержит полезные примеры расширения функционала
 */

// ============================================
// УЛУЧШЕНИЕ 1: Пользовательские хуки для валидации
// ============================================

// Файл: src/hooks/useFormValidation.js

import { useState, useCallback } from 'react';

export const useFormValidation = (initialState, onSubmit) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^\+?[\d\s\-()]{10,}$/.test(phone);
  };

  const validateForm = useCallback((validators) => {
    const newErrors = {};

    Object.entries(validators).forEach(([field, validator]) => {
      const error = validator(formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очистить ошибку при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback((validators) => async (e) => {
    e.preventDefault();

    if (!validateForm(validators)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await onSubmit(formData);
  }, [validateForm, onSubmit, formData]);

  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    validateForm,
    handleChange,
    handleSubmit,
    reset,
  };
};

// ============================================
// УЛУЧШЕНИЕ 2: Компрессия изображений перед отправкой
// ============================================

// Файл: src/utils/imageCompression.js

export const compressImage = async (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Уменьшить размер если необходимо
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Использование:
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  const compressedFiles = await Promise.all(
    files.map(file => compressImage(file))
  );
  setFormData(prev => ({
    ...prev,
    images: [...prev.images, ...compressedFiles]
  }));
};

// ============================================
// УЛУЧШЕНИЕ 3: Сохранение черновика в localStorage
// ============================================

// Файл: src/hooks/useAutoSave.js

import { useEffect, useCallback } from 'react';

export const useAutoSave = (formData, key = 'carFormDraft', interval = 30000) => {
  useEffect(() => {
    // Сохранить чернвовик при изменении формы
    const saveInterval = setInterval(() => {
      try {
        // Сохранить только данные, не файлы
        const dataToSave = { ...formData };
        delete dataToSave.images; // Не сохранять файлы
        
        localStorage.setItem(key, JSON.stringify(dataToSave));
        console.log('Draft saved');
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, interval);

    return () => clearInterval(saveInterval);
  }, [formData, key, interval]);

  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(key);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { loadDraft, clearDraft };
};

// Использование в компоненте:
useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    setFormData(prev => ({ ...prev, ...draft }));
  }
}, []);

// ============================================
// УЛУЧШЕНИЕ 4: Удобный компонент для Select
// ============================================

// Файл: src/components/FormSelect.jsx

import React from 'react';

const FormSelect = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  icon,
  disabled = false,
  required = true,
}) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {icon && <i className={`fas ${icon}`}></i>}
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`form-input select ${error ? 'error' : ''}`}
      >
        <option value="">Выберите...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormSelect;

// ============================================
// УЛУЧШЕНИЕ 5: Удобный компонент для Input
// ============================================

// Файл: src/components/FormInput.jsx

import React from 'react';

const FormInput = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  icon,
  placeholder,
  disabled = false,
  required = true,
  min,
  max,
  step,
  suffix,
}) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>
        {icon && <i className={`fas ${icon}`}></i>}
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="input-wrapper">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`form-input ${error ? 'error' : ''}`}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FormInput;

// ============================================
// УЛУЧШЕНИЕ 6: Progress bar компонент
// ============================================

// Файл: src/components/ProgressBar.jsx

import React from 'react';
import '../styles/ProgressBar.css';

const ProgressBar = ({ current, total, step }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress-steps">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`progress-step ${current > i ? 'completed' : ''} ${current === i + 1 ? 'active' : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="progress-text">
        Шаг {current} из {total}
      </div>
    </div>
  );
};

export default ProgressBar;

// ============================================
// УЛУЧШЕНИЕ 7: Loading spinner компонент
// ============================================

// Файл: src/components/LoadingSpinner.jsx

import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ fullScreen = false, message = 'Загрузка...' }) => {
  const spinnerClass = fullScreen ? 'spinner-full-screen' : 'spinner-inline';

  return (
    <div className={`spinner-container ${spinnerClass}`}>
      <div className="spinner">
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

// ============================================
// УЛУЧШЕНИЕ 8: Уведомления (Toast)
// ============================================

// Файл: src/hooks/useToast.js

import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// Компонент Toast:
const Toast = ({ id, message, type, onClose }) => {
  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={() => onClose(id)}>×</button>
    </div>
  );
};

// ============================================
// УЛУЧШЕНИЕ 9: Темная тема (Dark Mode)
// ============================================

// Файл: src/hooks/useDarkMode.js

import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', isDark);
  }, [isDark]);

  return [isDark, setIsDark];
};

// CSS переменные для темной темы:
/*
.dark-mode {
  --primary-color: #3b82f6;
  --text-dark: #f3f4f6;
  --text-light: #d1d5db;
  --bg-white: #1f2937;
  --bg-light: #111827;
  --border-color: #374151;
}
*/

// ============================================
// УЛУЧШЕНИЕ 10: Интеграция с API (правильная)
// ============================================

// Файл: src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const createAd = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ads/create`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create ad');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating ad:', error);
    throw error;
  }
};

export const getCarModels = async (brand) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cars/models/${brand}`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return await response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};

export const uploadImages = async (files) => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`images[${index}]`, file);
  });

  try {
    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) throw new Error('Upload failed');
    return await response.json();
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

// ============================================
// УЛУЧШЕНИЕ 11: Обновленный AddCarForm с вышеперечисленным
// ============================================

/*
import { useAutoSave } from '../hooks/useAutoSave';
import { useToast } from '../hooks/useToast';
import { createAd, uploadImages } from '../services/api';

const AddCarForm = () => {
  const [formData, setFormData] = useState({...});
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { loadDraft, clearDraft } = useAutoSave(formData);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData(prev => ({ ...prev, ...draft }));
      addToast('Черновик загружен', 'info');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('Пожалуйста, заполните все поля корректно', 'error');
      return;
    }

    setLoading(true);

    try {
      // Загрузить фото
      let imageUrls = [];
      if (formData.images.length > 0) {
        const result = await uploadImages(formData.images);
        imageUrls = result.urls;
      }

      // Отправить объявление
      const adData = {
        ...formData,
        images: imageUrls,
      };

      await createAd(adData);
      addToast('Объявление успешно создано!', 'success');
      clearDraft();
      // Перенаправить
      navigate('/');
    } catch (error) {
      addToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ...форма с компонентами выше
  );
};
*/

// ============================================
// ИТОГО: Что добавлено для улучшения
// ============================================

/*
✅ useFormValidation - кастомный хук для валидации
✅ imageCompression - сжатие фото перед отправкой
✅ useAutoSave - автосохранение черновика
✅ FormSelect - компонент для select полей
✅ FormInput - компонент для input полей
✅ ProgressBar - индикатор прогресса
✅ LoadingSpinner - спиннер загрузки
✅ useToast - система уведомлений
✅ useDarkMode - темная тема
✅ API service - правильная работа с API

Каждый улучшение можно добавлять независимо!
*/

export {
  useFormValidation,
  compressImage,
  useAutoSave,
  useToast,
  useDarkMode,
};
