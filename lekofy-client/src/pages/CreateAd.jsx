import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { API_URL } from '../services/api';

function CreateAd() {
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    navigate('login');
    return null;
  }

  const handleFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    // Позволяет повторно выбрать те же файлы.
    e.target.value = '';

    setFiles((prev) => {
      const existing = new Set(
        prev.map((f) => `${f.name}_${f.size}_${f.lastModified}`)
      );
      const next = [...prev];

      picked.forEach((file) => {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        if (!existing.has(key)) {
          next.push(file);
          existing.add(key);
        }
      });

      return next.slice(0, 5);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      setError('Заполните название и цену');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('phone', phone);
      formData.append('category', category);
      formData.append('city', city);
      files.forEach((file) => formData.append('images', file));

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Ошибка публикации');
      }
      alert('Объявление отправлено на модерацию! Оно появится после проверки.');
      navigate('home');
    } catch (e2) {
      setError(e2.message || 'Ошибка публикации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="create-form">
        <button
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
          onClick={() => navigate('home')}
        >
          ← Назад
        </button>
        <h2>Подать объявление</h2>
        <div
          style={{
            background: '#fff3e0',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#e65100',
          }}
        >
          ⏳ Объявление появится после проверки модератором
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Название *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: iPhone 14 Pro"
            />
          </label>
          <label>
            Описание
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите товар подробнее..."
            />
          </label>
          <label>
            Цена (сом) *
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </label>
          <label>
            Номер телефона
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+996 700 000 000"
            />
          </label>
          <label>
            Категория
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Выберите категорию</option>
              <option value="electronics">Электроника</option>
              <option value="transport">Транспорт</option>
              <option value="realty">Недвижимость</option>
              <option value="clothes">Одежда</option>
              <option value="furniture">Мебель</option>
              <option value="jobs">Работа</option>
              <option value="services">Услуги</option>
              <option value="other">Другое</option>
            </select>
          </label>
          <label>
            Город
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Бишкек"
            />
          </label>

          <label>
            Фото (до 5 штук)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
            />
          </label>
          {files.length > 0 && (
            <div className="preview-images" style={{ marginTop: 8 }}>
              {files.map((file) => (
                <span
                  key={file.name}
                  style={{ fontSize: 12, marginRight: 8, color: '#555' }}
                >
                  {file.name}
                </span>
              ))}
            </div>
          )}

          {error && (
            <p style={{ color: 'red', marginTop: 8, fontSize: 13 }}>{error}</p>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAd;

