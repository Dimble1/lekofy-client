import { useEffect, useMemo, useState } from 'react';
import { favoritesAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingAnimation from '../components/LoadingAnimation.jsx';
import '../styles/Favorites.css';

const priceFormatter = new Intl.NumberFormat('ru-RU');

const parsePrice = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (ad) => {
  const candidates = [ad?.createdAt, ad?.updatedAt, ad?.created_at, ad?.date];
  const dateValue = candidates.find(Boolean);
  if (!dateValue) return 0;

  const timestamp = new Date(dateValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatRelative = (ad) => {
  const stamp = parseDate(ad);
  if (!stamp) return 'Без даты';

  const minutes = Math.floor((Date.now() - stamp) / 60000);
  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн назад`;

  return new Date(stamp).toLocaleDateString('ru-RU');
};

function Favorites() {
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    document.body.classList.add('favorites-view');
    return () => {
      document.body.classList.remove('favorites-view');
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
        const data = await favoritesAPI.getAll();
        setAds(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки избранного');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoggedIn, navigate]);

  const sortedAds = useMemo(() => {
    const list = [...ads];

    if (sortBy === 'price') {
      list.sort((a, b) => parsePrice(a?.price) - parsePrice(b?.price));
      return list;
    }

    list.sort((a, b) => parseDate(b) - parseDate(a));
    return list;
  }, [ads, sortBy]);

  const removeFromFavorites = async (event, adId) => {
    event.stopPropagation();

    if (!adId || removingId) return;

    try {
      setRemovingId(adId);
      await favoritesAPI.remove(adId);
      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (e) {
      alert(e.message || 'Не удалось удалить из избранного');
    } finally {
      setRemovingId(null);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <section className="favorites-page">
      <div className="favorites-head">
        <div>
          <h1 className="favorites-title">Избранное</h1>
          <p className="favorites-subtitle">{sortedAds.length} объявлений сохранено</p>
        </div>

        <div className="favorites-sort">
          <span>Сортировать:</span>
          <div className="favorites-sort-group">
            <button
              type="button"
              className={sortBy === 'newest' ? 'active' : ''}
              onClick={() => setSortBy('newest')}
            >
              Сначала новые
            </button>
            <button
              type="button"
              className={sortBy === 'price' ? 'active' : ''}
              onClick={() => setSortBy('price')}
            >
              По цене
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="favorites-back"
        onClick={() => navigate('home')}
      >
        ← Назад
      </button>

      {loading && (
        <LoadingAnimation
          message="Загрузка избранного..."
          hint="Проверяем сохраненные объявления"
        />
      )}
      {!!error && <p className="favorites-state favorites-state-error">{error}</p>}
      {!loading && !error && !sortedAds.length && (
        <p className="favorites-state">В избранном пока пусто.</p>
      )}

      {!loading && !error && sortedAds.length > 0 && (
        <div className="favorites-grid">
          {sortedAds.map((ad) => {
            const adId = ad?.id;
            const imageUrl = Array.isArray(ad?.images) && ad.images.length ? ad.images[0] : null;
            const price = parsePrice(ad?.price);

            return (
              <article
                key={adId}
                className="favorites-card"
                onClick={() => navigate('ad-detail', { id: adId })}
              >
                <div className="favorites-card-media">
                  {imageUrl ? (
                    <img src={imageUrl} alt={ad?.title || 'Объявление'} />
                  ) : (
                    <div className="favorites-card-placeholder">Нет фото</div>
                  )}

                  <button
                    type="button"
                    className="favorites-fav-btn"
                    title="Убрать из избранного"
                    disabled={removingId === adId}
                    onClick={(event) => removeFromFavorites(event, adId)}
                  >
                    ❤
                  </button>
                </div>

                <div className="favorites-card-body">
                  <div className="favorites-card-top">
                    <h3>{ad?.title || 'Без названия'}</h3>
                    <p>{priceFormatter.format(price)} сом</p>
                  </div>

                  <p className="favorites-card-location">
                    {ad?.city || ad?.location || 'Город не указан'}
                  </p>

                  <div className="favorites-card-bottom">
                    <span>{formatRelative(ad)}</span>
                    <button
                      type="button"
                      className="favorites-remove-link"
                      disabled={removingId === adId}
                      onClick={(event) => removeFromFavorites(event, adId)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Favorites;
