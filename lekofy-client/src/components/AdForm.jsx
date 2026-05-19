import React, { useState } from 'react';
import '../styles/AdForm.css';
import { adsAPI } from '../services/api';

// helper to create input components based on type
const renderField = (field, value, onChange, error) => {
  const commonProps = {
    id: field.name,
    name: field.name,
    value: value || '',
    onChange,
    className: `form-input ${error ? 'error' : ''}`,
    placeholder: field.placeholder || ''
  };

  switch (field.type) {
    case 'text':
    case 'number':
      return <input type={field.type} {...commonProps} min={field.min} max={field.max} step={field.step || 1} />;
    case 'select':
      return (
        <select {...commonProps}>
          <option value="">Выберите...</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'textarea':
      return <textarea {...commonProps} rows={field.rows || 3} />;
    default:
      return <input type="text" {...commonProps} />;
  }
};

const AdForm = ({ category, onBack }) => {
  // initial form values
  const initialData = {
    title: '',
    price: '',
    description: '',
    city: '',
    contact: '',
  };

  // add extra fields names to initial data
  category.extraFields.forEach(f => {
    initialData[f.name] = '';
  });

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Позволяет выбрать те же файлы повторно в следующем открытии диалога.
    e.target.value = '';

    const existingKeys = new Set(
      images.map((f) => `${f.name}_${f.size}_${f.lastModified}`)
    );
    const uniqueFiles = files.filter((f) => {
      const key = `${f.name}_${f.size}_${f.lastModified}`;
      return !existingKeys.has(key);
    });

    if (uniqueFiles.length === 0) return;

    if (uniqueFiles.length + images.length > 10) {
      setErrors(prev => ({ ...prev, images: 'Максимум 10 фото' }));
      return;
    }
    const newPreviews = [...preview];
    uniqueFiles.forEach(file => {
      newPreviews.push(URL.createObjectURL(file));
    });
    setPreview(newPreviews);
    setImages(prev => [...prev, ...uniqueFiles]);
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_,i)=>i!==idx));
    setPreview(prev => prev.filter((_,i)=>i!==idx));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Введите название';
    if (!formData.price || parseFloat(formData.price) <= 0) errs.price = 'Введите цену';
    if (!formData.description.trim()) errs.description = 'Введите описание';
    if (!formData.city.trim()) errs.city = 'Укажите город';
    if (!formData.contact.trim()) errs.contact = 'Укажите контакт';
    if (images.length === 0) errs.images = 'Добавьте фото';

    // extra fields required
    category.extraFields.forEach(f => {
      if (!formData[f.name] || !String(formData[f.name]).trim()) {
        errs[f.name] = 'Обязательное поле';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const meta = {};
      category.extraFields.forEach(f => {
        meta[f.name] = formData[f.name];
      });

      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('price', formData.price);
      payload.append('city', formData.city);
      payload.append('phone', formData.contact);
      payload.append('category', category.id);
      payload.append('meta', JSON.stringify(meta));
      images.forEach((image) => {
        payload.append('images', image);
      });

      await adsAPI.create(payload);
      alert('Объявление опубликовано!');
      // Можно добавить навигацию на home или мои объявления
    } catch (error) {
      alert('Ошибка при публикации: ' + error.message);
    }
  };

  return (
    <div className="ad-form-container">
      <div className="ad-form-header">
        <button className="back-button" onClick={onBack}>&larr; Назад</button>
        <h2>
          <i className={`fas ${category.icon}`}></i> {category.label}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="ad-form">
        {/* general fields */}
        <div className="form-group">
          <label htmlFor="title"><i className="fas fa-heading"></i> Название объявления</label>
          {renderField({ name:'title', type:'text' }, formData.title, handleChange, errors.title)}
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="price"><i className="fas fa-money-bill-wave"></i> Цена</label>
          <div className="price-wrapper">
            {renderField({ name:'price', type:'number' }, formData.price, handleChange, errors.price)}
            <span className="currency">сом</span>
          </div>
          {errors.price && <span className="error-message">{errors.price}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description"><i className="fas fa-file-alt"></i> Описание</label>
          {renderField({ name:'description', type:'textarea' }, formData.description, handleChange, errors.description)}
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="city"><i className="fas fa-city"></i> Город</label>
          {renderField({ name:'city', type:'text' }, formData.city, handleChange, errors.city)}
          {errors.city && <span className="error-message">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contact"><i className="fas fa-phone"></i> Контакт</label>
          {renderField({ name:'contact', type:'text' }, formData.contact, handleChange, errors.contact)}
          {errors.contact && <span className="error-message">{errors.contact}</span>}
        </div>

        {/* extra fields */}
        {category.extraFields.map(field => (
          <div className="form-group" key={field.name}>
            <label htmlFor={field.name}>
              {field.icon && <i className={`fas ${field.icon}`}></i>} {field.label}
            </label>
            {renderField(field, formData[field.name], handleChange, errors[field.name])}
            {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
          </div>
        ))}

        {/* image upload */}
        <div className="form-group">
          <label><i className="fas fa-images"></i> Фото</label>
          <div className={`upload-area ${images.length > 0 ? 'has-images' : ''}`}>
            <input
              type="file"
              id="ad-images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <label htmlFor="ad-images" className="upload-label">
              <div className="upload-icon">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <p className="upload-text">
                {images.length > 0 ? `Выбрано фото: ${images.length}/10` : 'Нажмите, чтобы выбрать фото'}
              </p>
              <p className="upload-hint">
                JPG, PNG, WEBP до 10 файлов
              </p>
            </label>
          </div>
          <div className="preview-grid">
            {preview.map((src,idx)=>(
              <div key={idx} className="preview-item">
                <img src={src} alt="preview" />
                <button type="button" onClick={()=>removeImage(idx)} className="remove-btn">
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
          {errors.images && <span className="error-message">{errors.images}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Опубликовать</button>
          <button type="button" className="btn-secondary" onClick={onBack}>Отмена</button>
        </div>
      </form>
    </div>
  );
};

export default AdForm;
