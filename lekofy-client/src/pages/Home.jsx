import { useEffect, useState } from 'react';
import AdCard from '../components/AdCard';
import { adsAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { categories } from '../data/categories';

const CATEGORIES = categories.map((c) => ({
  id: c.id,
  label: c.label,
  icon: c.icon || 'fa-layer-group',
}));

const FEATURE_PILLS = [
  { label: 'Срочные', icon: 'fa-fire-flame-curved', active: true },
  { label: 'VIP', icon: 'fa-star' },
  { label: 'Авто', icon: 'fa-car' },
  { label: 'Недвижимость', icon: 'fa-house' },
];

const TRUST_POINTS = [
  { icon: 'fa-shield-halved', label: 'Безопасные сделки' },
  { icon: 'fa-circle-check', label: 'Проверенные продавцы' },
  { icon: 'fa-headset', label: '24/7 Поддержка' },
];

function Home() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { navigate } = useRouter();
  const { isLoggedIn } = useAuth();

  const loadAds = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adsAPI.getAll(filters);
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить объявления');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const applyFilters = () => {
    loadAds({
      search,
      category,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });
  };

  const handleCategoryClick = (categoryId) => {
    setCategory(categoryId);
    loadAds({
      search,
      category: categoryId,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });

    setTimeout(() => {
      const el = document.getElementById('ads-list');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <div className="home-hero__eyebrow">
            <span className="home-dot" />
            Premium marketplace
          </div>

          <h1 className="home-hero__title">Покупайте и продавайте легко по всему Кыргызстану</h1>

          <p className="home-hero__subtitle">
            Быстрый поиск, свежие объявления и аккуратный премиальный интерфейс для
            сделок без лишнего шума.
          </p>

          <div className="home-search">
            <span className="fa-solid fa-magnifying-glass home-search__icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Что вы ищете?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              aria-label="Поиск объявлений"
            />
            <button className="home-search__button" type="button" onClick={applyFilters}>
              Поиск
            </button>
          </div>

          <div className="home-hero__actions">
            <button
              type="button"
              className="home-button home-button--primary"
              onClick={() => (isLoggedIn ? navigate('publish') : navigate('login'))}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Подать объявление
            </button>
            <button
              type="button"
              className="home-button home-button--secondary"
              onClick={applyFilters}
            >
              Применить фильтры
            </button>
          </div>

          <div className="home-location">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            <span>Весь Кыргызстан</span>
            <i className="fa-solid fa-chevron-down" aria-hidden="true" />
          </div>
        </div>

        <div className="home-hero__panel">
          <div className="home-panel__header">
            <div>
              <p className="home-panel__label">Категории</p>
              <h2>Быстрый вход в популярные разделы</h2>
            </div>
            <button
              type="button"
              className={[
                'home-category-chip',
                !category ? 'home-category-chip--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleCategoryClick('')}
            >
              <i className="fa-solid fa-layer-group" aria-hidden="true" />
              <span>Все</span>
            </button>
          </div>

          <div className="home-category-grid">
            {CATEGORIES.slice(0, 6).map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={[
                    'home-category-card',
                    active ? 'home-category-card--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleCategoryClick(c.id)}
                  title={c.label}
                >
                  <span className="home-category-card__icon">
                    <i className={`fa-solid ${c.icon}`} aria-hidden="true" />
                  </span>
                  <span className="home-category-card__label">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-section home-section--pills">
        <div className="home-pill-row">
          {FEATURE_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              className={['home-pill', pill.active ? 'home-pill--active' : '']
                .filter(Boolean)
                .join(' ')}
              onClick={applyFilters}
            >
              <i className={`fa-solid ${pill.icon}`} aria-hidden="true" />
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-banner">
        <div className="home-banner__copy">
          <p className="home-banner__label">Премиум-размещение</p>
          <h2>Подайте объявление, которое сразу заметят</h2>
          <p>
            Аккуратный баннер с сильным контрастом помогает быстрее провести покупателя
            к действию.
          </p>
        </div>
        <button
          type="button"
          className="home-button home-button--light"
          onClick={() => (isLoggedIn ? navigate('publish') : navigate('login'))}
        >
          Разместить
        </button>
      </section>

      <section className="home-trust">
        {TRUST_POINTS.map((point) => (
          <div key={point.label} className="home-trust__item">
            <i className={`fa-solid ${point.icon}`} aria-hidden="true" />
            <span>{point.label}</span>
          </div>
        ))}
      </section>

      <section className="home-feed" id="ads-list">
        <div className="home-feed__header">
          <div>
            <p className="home-section__label">Рекомендации</p>
            <h2>Свежие объявления</h2>
          </div>
          <button type="button" className="home-feed__link" onClick={() => handleCategoryClick('')}>
            Все
          </button>
        </div>

        {loading && <p className="home-state">Загружаем объявления...</p>}
        {error && <p className="home-state home-state--error">{error}</p>}

        {!loading && !error && (
          <div className="home-grid">
            {ads.map((ad) => (
              <a
                key={ad.id}
                href={`#/ad/${encodeURIComponent(ad.id)}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('ad-detail', { id: ad.id });
                }}
                className="home-grid__link"
              >
                <AdCard
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  description={ad.description}
                  imageUrl={
                    Array.isArray(ad.images) && ad.images.length ? ad.images[0] : undefined
                  }
                />
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
