import { useEffect, useMemo, useState } from 'react';
import { adsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { categories } from '../data/categories';
import LoadingAnimation from '../components/LoadingAnimation.jsx';
import '../styles/MyAds.css';

const STATUS_LABELS = {
  active: 'Активно',
  pending: 'На проверке',
  rejected: 'Отклонено',
  sold: 'Продано',
  archived: 'В архиве',
};

const EMPTY_EDIT_FORM = {
  title: '',
  description: '',
  price: '',
  category: '',
  city: '',
  phone: '',
  images: [],
};

function normalizeAds(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.ads)) return payload.ads;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function MyAds() {
  const { user, isLoggedIn } = useAuth();
  const { navigate } = useRouter();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteState, setDeleteState] = useState({ loadingId: null, error: '' });

  const [editState, setEditState] = useState({
    adId: null,
    form: EMPTY_EDIT_FORM,
    newFiles: [],
    saving: false,
    error: '',
  });

  const newFilePreviews = useMemo(() => {
    return editState.newFiles.map((file) => ({
      key: `${file.name}_${file.size}_${file.lastModified}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
  }, [editState.newFiles]);

  useEffect(() => {
    return () => {
      newFilePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [newFilePreviews]);

  useEffect(() => {
    document.body.classList.add('my-ads-theme-active');
    const root = document.getElementById('root');
    root?.classList.add('my-ads-root-active');

    return () => {
      document.body.classList.remove('my-ads-theme-active');
      root?.classList.remove('my-ads-root-active');
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adsAPI.getMyAds();
        setAds(normalizeAds(response));
      } catch (e) {
        setError(e.message || 'Не удалось загрузить ваши объявления');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoggedIn, navigate]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const title = String(ad?.title || '').toLowerCase();
      const city = String(ad?.city || '').toLowerCase();
      const text = `${title} ${city}`;
      const query = search.trim().toLowerCase();
      const status = String(ad?.status || 'active').toLowerCase();

      const matchesQuery = !query || text.includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [ads, search, statusFilter]);

  const stats = useMemo(() => {
    const total = ads.length;
    const active = ads.filter((ad) => String(ad?.status || 'active').toLowerCase() === 'active').length;
    const pending = ads.filter((ad) => String(ad?.status || '').toLowerCase() === 'pending').length;
    const sold = ads.filter((ad) => String(ad?.status || '').toLowerCase() === 'sold').length;

    return { total, active, pending, sold };
  }, [ads]);

  const formatPrice = (price) => {
    const numeric = Number(price || 0);
    return `${numeric.toLocaleString('ru-RU')} сом`;
  };

  const formatDate = (value) => {
    if (!value) return 'Дата неизвестна';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Дата неизвестна';

    return parsed.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const statusText = (status) => {
    const key = String(status || 'active').toLowerCase();
    return STATUS_LABELS[key] || 'Активно';
  };

  const handleDelete = async (adId) => {
    if (!adId || deleteState.loadingId) return;

    const confirmDelete = window.confirm('Удалить это объявление? Действие нельзя отменить.');
    if (!confirmDelete) return;

    try {
      setDeleteState({ loadingId: adId, error: '' });
      await adsAPI.delete(adId);
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (e) {
      setDeleteState({ loadingId: null, error: e.message || 'Не удалось удалить объявление' });
      return;
    }

    setDeleteState({ loadingId: null, error: '' });
  };

  const openEditModal = (ad) => {
    if (!ad) return;

    setEditState({
      adId: ad.id,
      saving: false,
      error: '',
      newFiles: [],
      form: {
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price ?? '',
        category: ad.category || '',
        city: ad.city || '',
        phone: ad.phone || '',
        images: Array.isArray(ad.images) ? ad.images : [],
      },
    });
  };

  const closeEditModal = (force = false) => {
    if (editState.saving && !force) return;

    setEditState({
      adId: null,
      form: EMPTY_EDIT_FORM,
      newFiles: [],
      saving: false,
      error: '',
    });
  };

  const onEditFieldChange = (field, value) => {
    setEditState((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  const onPickNewImages = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    if (picked.length === 0) return;

    setEditState((prev) => {
      const currentKeys = new Set(prev.newFiles.map((f) => `${f.name}_${f.size}_${f.lastModified}`));
      const nextFiles = [...prev.newFiles];

      for (const file of picked) {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        if (!currentKeys.has(key)) {
          nextFiles.push(file);
          currentKeys.add(key);
        }
      }

      return {
        ...prev,
        newFiles: nextFiles.slice(0, 10),
      };
    });
  };

  const removeExistingImage = (idx) => {
    setEditState((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        images: prev.form.images.filter((_, index) => index !== idx),
      },
    }));
  };

  const removeNewFile = (idx) => {
    setEditState((prev) => ({
      ...prev,
      newFiles: prev.newFiles.filter((_, index) => index !== idx),
    }));
  };

  const submitEdit = async (event) => {
    event.preventDefault();

    const adId = editState.adId;
    if (!adId) return;

    const cleanTitle = editState.form.title.trim();
    const cleanPrice = Number(editState.form.price);

    if (!cleanTitle) {
      setEditState((prev) => ({ ...prev, error: 'Название не может быть пустым.' }));
      return;
    }

    if (!Number.isFinite(cleanPrice) || cleanPrice <= 0) {
      setEditState((prev) => ({ ...prev, error: 'Укажите корректную цену больше 0.' }));
      return;
    }

    const formData = new FormData();
    formData.append('title', cleanTitle);
    formData.append('description', editState.form.description.trim());
    formData.append('price', String(cleanPrice));
    formData.append('category', editState.form.category);
    formData.append('city', editState.form.city.trim());
    formData.append('phone', editState.form.phone.trim());
    formData.append('existingImages', JSON.stringify(editState.form.images || []));

    editState.newFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      setEditState((prev) => ({ ...prev, saving: true, error: '' }));
      const updated = await adsAPI.update(adId, formData);

      setAds((prevAds) =>
        prevAds.map((ad) => {
          if (ad.id !== adId) return ad;
          if (updated && typeof updated === 'object' && !updated.error) {
            return { ...ad, ...updated };
          }
          return {
            ...ad,
            title: cleanTitle,
            description: editState.form.description.trim(),
            price: cleanPrice,
            category: editState.form.category,
            city: editState.form.city.trim(),
            phone: editState.form.phone.trim(),
            images: editState.form.images,
          };
        }),
      );

      closeEditModal(true);
    } catch (e) {
      setEditState((prev) => ({ ...prev, saving: false, error: e.message || 'Не удалось сохранить изменения' }));
    }
  };

  return (
    <div className="my-ads-page">
      <section className="my-ads-header-card">
        <div>
          <p className="my-ads-kicker">Личный кабинет</p>
          <h1>Мои объявления</h1>
          <p className="my-ads-subtitle">Управляйте публикациями, отслеживайте статус и быстро переходите к просмотру.</p>
        </div>
        <button className="my-ads-create-btn" onClick={() => navigate('publish')}>
          + Подать объявление
        </button>
      </section>

      <section className="my-ads-stats-grid">
        <article className="my-ads-stat-card">
          <span>Всего</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="my-ads-stat-card">
          <span>Активные</span>
          <strong>{stats.active}</strong>
        </article>
        <article className="my-ads-stat-card">
          <span>На проверке</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="my-ads-stat-card">
          <span>Проданные</span>
          <strong>{stats.sold}</strong>
        </article>
      </section>

      <section className="my-ads-toolbar">
        <input
          type="text"
          placeholder="Поиск по названию или городу..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Все статусы</option>
          <option value="active">Активно</option>
          <option value="pending">На проверке</option>
          <option value="sold">Продано</option>
          <option value="rejected">Отклонено</option>
          <option value="archived">В архиве</option>
        </select>
      </section>

      <section className="my-ads-list-wrap">
        <div className="my-ads-list-head">
          <span>Найдено: {filteredAds.length}</span>
          <span>{user?.name ? `Профиль: ${user.name}` : 'Ваши публикации'}</span>
        </div>

        {loading && (
          <LoadingAnimation
            message="Загружаем ваши объявления..."
            hint="Собираем список публикаций"
          />
        )}
        {!loading && error && <div className="my-ads-empty my-ads-error">{error}</div>}
        {!loading && !error && deleteState.error && <div className="my-ads-empty my-ads-error">{deleteState.error}</div>}

        {!loading && !error && filteredAds.length === 0 && (
          <div className="my-ads-empty">По выбранным фильтрам объявлений нет.</div>
        )}

        {!loading && !error && filteredAds.length > 0 && (
          <div className="my-ads-list">
            {filteredAds.map((ad) => {
              const adStatus = String(ad?.status || 'active').toLowerCase();
              return (
                <article key={ad.id} className="my-ads-item">
                  <div className="my-ads-image-wrap">
                    {Array.isArray(ad.images) && ad.images[0] ? (
                      <img src={ad.images[0]} alt={ad.title || 'Объявление'} />
                    ) : (
                      <div className="my-ads-image-placeholder">Нет фото</div>
                    )}
                  </div>

                  <div className="my-ads-item-main">
                    <div className="my-ads-item-top">
                      <span className={`my-ads-status my-ads-status--${adStatus}`}>{statusText(adStatus)}</span>
                      <span className="my-ads-date">{formatDate(ad.updatedAt || ad.createdAt)}</span>
                    </div>

                    <h3>{ad.title || 'Без названия'}</h3>
                    <p>{ad.description || 'Описание отсутствует.'}</p>

                    <div className="my-ads-meta">
                      <strong>{formatPrice(ad.price)}</strong>
                      <span>{ad.city || 'Город не указан'}</span>
                      <span>Просмотры: {Number(ad.views || 0)}</span>
                    </div>
                  </div>

                  <div className="my-ads-actions">
                    <button onClick={() => navigate('ad-detail', { id: ad.id })}>Открыть</button>
                    <button onClick={() => openEditModal(ad)}>Редактировать</button>
                    <button className="danger" onClick={() => handleDelete(ad.id)} disabled={deleteState.loadingId === ad.id}>
                      {deleteState.loadingId === ad.id ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editState.adId && (
        <div className="my-ads-modal-backdrop" role="dialog" aria-modal="true">
          <div className="my-ads-modal">
            <div className="my-ads-modal-head">
              <h2>Редактировать объявление</h2>
              <button type="button" onClick={closeEditModal} disabled={editState.saving}>
                ✕
              </button>
            </div>

            <form className="my-ads-modal-form" onSubmit={submitEdit}>
              <label>
                Название *
                <input
                  type="text"
                  value={editState.form.title}
                  onChange={(event) => onEditFieldChange('title', event.target.value)}
                  maxLength={120}
                />
              </label>

              <label>
                Описание
                <textarea
                  rows={4}
                  value={editState.form.description}
                  onChange={(event) => onEditFieldChange('description', event.target.value)}
                />
              </label>

              <div className="my-ads-modal-grid">
                <label>
                  Цена (сом) *
                  <input
                    type="number"
                    min="1"
                    value={editState.form.price}
                    onChange={(event) => onEditFieldChange('price', event.target.value)}
                  />
                </label>

                <label>
                  Категория
                  <select
                    value={editState.form.category}
                    onChange={(event) => onEditFieldChange('category', event.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="my-ads-modal-grid">
                <label>
                  Город
                  <input
                    type="text"
                    value={editState.form.city}
                    onChange={(event) => onEditFieldChange('city', event.target.value)}
                  />
                </label>

                <label>
                  Телефон
                  <input
                    type="text"
                    value={editState.form.phone}
                    onChange={(event) => onEditFieldChange('phone', event.target.value)}
                  />
                </label>
              </div>

              <div className="my-ads-photo-block">
                <p className="my-ads-photo-title">Фото объявления</p>

                {editState.form.images.length > 0 ? (
                  <div className="my-ads-photo-grid">
                    {editState.form.images.map((url, idx) => (
                      <div className="my-ads-photo-item" key={`${url}_${idx}`}>
                        <img src={url} alt={`Фото ${idx + 1}`} />
                        <button type="button" onClick={() => removeExistingImage(idx)} disabled={editState.saving}>
                          Убрать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="my-ads-photo-empty">Нет текущих фото.</div>
                )}

                <label className="my-ads-photo-upload">
                  Добавить новые фото
                  <input type="file" accept="image/*" multiple onChange={onPickNewImages} disabled={editState.saving} />
                </label>

                {newFilePreviews.length > 0 && (
                  <div className="my-ads-photo-grid my-ads-photo-grid--new">
                    {newFilePreviews.map((item, idx) => (
                      <div className="my-ads-photo-item" key={item.key}>
                        <img src={item.url} alt={item.name} />
                        <button type="button" onClick={() => removeNewFile(idx)} disabled={editState.saving}>
                          Убрать
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editState.error && <div className="my-ads-modal-error">{editState.error}</div>}

              <div className="my-ads-modal-actions">
                <button type="button" className="ghost" onClick={closeEditModal} disabled={editState.saving}>
                  Отмена
                </button>
                <button type="submit" disabled={editState.saving}>
                  {editState.saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAds;
