import { useState, useEffect } from 'react';
import AdCard from "../components/AdCard";
import { adsAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { categories } from '../data/categories';

const CATEGORIES = categories.map((c) => ({
  id: c.id,
  label: c.label,
  icon: c.icon || 'fa-layer-group',
}));

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
    // Мягко прокручиваем к списку
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
    <>
      <div className="hero hero--split">
        <div className="hero-main">
          <h1>Lekofy</h1>
          <p>Покупайте и продавайте легко по всему Кыргызстану</p>

          <div className="search-bar hero-search">
            <input
              type="text"
              placeholder="Поиск объявлений..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
            />
            <button className="icon-button" type="button" onClick={applyFilters}>
              <i className="fas fa-search"></i>
            </button>
          </div>

          <div className="filters hero-filters">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Все категории</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Цена от"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Цена до"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <button className="btn btn-primary" type="button" onClick={applyFilters}>
              Применить
            </button>
            {isLoggedIn && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => navigate('publish')}
              >
                <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Подать объявление
              </button>
            )}
          </div>
        </div>

        <div className="hero-categories">
          <div className="hero-categories-header">
            <div className="hero-categories-title">
              <i className="fa-solid fa-icons"></i>
              <span>Категории</span>
            </div>
            <button
              type="button"
              className={['hero-category-chip', !category ? 'hero-category-chip--active' : ''].filter(Boolean).join(' ')}
              onClick={() => handleCategoryClick('')}
            >
              <i className="fa-solid fa-layer-group" />
              <span>Все</span>
            </button>
          </div>

          <div className="hero-category-grid">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={['hero-category-tile', active ? 'hero-category-tile--active' : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleCategoryClick(c.id)}
                  title={c.label}
                >
                  <span className="hero-category-icon">
                    <i className={`fa-solid ${c.icon}`} />
                  </span>
                  <span className="hero-category-label">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container" id="ads-list">
        {loading && (
          <p style={{ textAlign: 'center', marginTop: 20 }}>Загружаем объявления...</p>
        )}
        {error && (
          <p style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>{error}</p>
        )}
        {!loading && !error && (
          <div className="grid">
            {ads.map((ad) => (
              <a
                key={ad.id}
                href={`#/ad/${encodeURIComponent(ad.id)}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('ad-detail', { id: ad.id });
                }}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <AdCard
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  description={ad.description}
                  imageUrl={
                    Array.isArray(ad.images) && ad.images.length
                      ? ad.images[0]
                      : undefined
                  }
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
