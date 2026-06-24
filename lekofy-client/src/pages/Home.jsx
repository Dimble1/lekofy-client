import { useEffect, useMemo, useState } from 'react';
import { adsAPI, favoritesAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { categories } from '../data/categories';
import LoadingAnimation from '../components/LoadingAnimation.jsx';

const NAV_LINKS = [
  { label: 'Категории', target: 'categories' },
  { label: 'Новые', target: 'new-ads' },
  { label: 'Популярные', target: 'popular-ads' },
  { label: 'Доверие', target: 'trust' },
];

const QUICK_FILTERS = [
  { id: 'recent', label: 'Недавно', icon: 'fa-bolt' },
  { id: 'popular', label: 'Популярные', icon: 'fa-fire-flame-curved' },
  { id: 'with_photo', label: 'С фото', icon: 'fa-image' },
  { id: 'budget', label: 'До 50 000 сом', icon: 'fa-wallet' },
];

const TRUST_POINTS = [
  { icon: 'fa-shield-heart', title: 'Проверенные продавцы', text: 'Премиальный UX с доверием к каждому объявлению.' },
  { icon: 'fa-bolt', title: 'Быстрый поиск', text: 'Мгновенные фильтры и моментальный доступ к нужным товарам.' },
  { icon: 'fa-lock', title: 'Безопасные сделки', text: 'Понятные сценарии общения и комфортный путь к покупке.' },
  { icon: 'fa-layer-group', title: 'Тысячи объявлений', text: 'Живая витрина по всему Кыргызстану в одном экране.' },
];

const CATEGORY_OVERRIDES = {
  cars: { accent: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', icon: 'fa-car-side' },
  real_estate: { accent: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)', icon: 'fa-building' },
  electronics: { accent: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)', icon: 'fa-mobile-screen' },
  jobs: { accent: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', icon: 'fa-briefcase' },
  services: { accent: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)', icon: 'fa-handshake-angle' },
  clothing: { accent: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)', icon: 'fa-shirt' },
};

function formatPrice(value) {
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(numeric) || numeric <= 0) {
    return 'Цена по запросу';
  }

  return `${new Intl.NumberFormat('ru-RU').format(numeric)} сом`;
}

function formatDate(value) {
  if (!value) return 'Недавно';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Недавно';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function getAdImage(ad) {
  if (Array.isArray(ad?.images) && ad.images.length > 0) {
    return ad.images[0];
  }

  return null;
}

function getCity(ad) {
  return ad?.city || ad?.location || ad?.district || 'Кыргызстан';
}

function getPublishedAt(ad) {
  return ad?.createdAt || ad?.publishedAt || ad?.updatedAt || ad?.date || null;
}

function getPopularityScore(ad) {
  return (
    Number(ad?.viewsCount || ad?.views || 0) +
    Number(ad?.favoritesCount || ad?.favorites || 0) * 2 +
    Number(ad?.rating || 0) * 10 +
    Number(ad?.featured ? 20 : 0)
  );
}

function getCategoryMeta(category) {
  const override = CATEGORY_OVERRIDES[category.id] || {};
  return {
    ...category,
    icon: override.icon || category.icon || 'fa-layer-group',
    accent: override.accent || 'from-sky-500 to-blue-600',
  };
}

function MarketplaceVisual({ ads, featuredCount }) {
  const visualAds = ads.slice(0, 3);

  return (
    <div className="lekofy-visual">
      <div className="lekofy-visual__halo" />
      <div className="lekofy-visual__frame">
        <div className="lekofy-visual__topline">
          <div className="lekofy-visual__badge">
            <span className="lekofy-visual__badge-dot" />
            Marketplace 2026
          </div>
          <div className="lekofy-visual__metric">
            <strong>{featuredCount}</strong>
            <span>активных объявлений</span>
          </div>
        </div>

        <div className="lekofy-visual__stack">
          {visualAds.map((ad, index) => (
            <div key={ad.id || `${ad.title}-${index}`} className={`lekofy-visual__card lekofy-visual__card--${index + 1}`}>
              <div className="lekofy-visual__thumb">
                {getAdImage(ad) ? (
                  <img src={getAdImage(ad)} alt={ad.title} />
                ) : (
                  <div className="lekofy-visual__thumb-fallback">
                    <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="lekofy-visual__copy">
                <div>
                  <p>{ad.title}</p>
                  <span>{getCity(ad)}</span>
                </div>
                <strong>{formatPrice(ad.price)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="lekofy-visual__floating lekofy-visual__floating--search">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <div>
            <strong>Поиск за 1 касание</strong>
            <span>Категории, город и цена в одном поле</span>
          </div>
        </div>

        <div className="lekofy-visual__floating lekofy-visual__floating--trust">
          <i className="fa-solid fa-shield-heart" aria-hidden="true" />
          <div>
            <strong>Доверие пользователей</strong>
            <span>Проверенные продавцы и безопасные сделки</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ ad, onOpen, onFavorite, favoriteBusy, isFavorite, onRequireAuth }) {
  const image = getAdImage(ad);
  const city = getCity(ad);
  const publishedAt = getPublishedAt(ad);

  return (
    <article className="lekofy-ad-card">
      <button type="button" className="lekofy-ad-card__media" onClick={() => onOpen(ad)} aria-label={ad.title}>
        {image ? (
          <img src={image} alt={ad.title} />
        ) : (
          <div className="lekofy-ad-card__media-fallback">
            <i className="fa-solid fa-image" aria-hidden="true" />
          </div>
        )}
        <span className="lekofy-ad-card__chip">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          Проверено
        </span>
      </button>

      <div className="lekofy-ad-card__body">
        <div className="lekofy-ad-card__head">
          <div className="lekofy-ad-card__price">{formatPrice(ad.price)}</div>
          <button
            type="button"
            className={`lekofy-favorite ${isFavorite ? 'lekofy-favorite--active' : ''}`}
            disabled={favoriteBusy}
            onClick={() => {
              if (onRequireAuth) {
                onRequireAuth();
                return;
              }
              onFavorite(ad);
            }}
            aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart`} aria-hidden="true" />
          </button>
        </div>

        <button type="button" className="lekofy-ad-card__title" onClick={() => onOpen(ad)}>
          {ad.title}
        </button>

        <div className="lekofy-ad-card__meta">
          <span>
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {city}
          </span>
          <span>
            <i className="fa-regular fa-clock" aria-hidden="true" />
            {formatDate(publishedAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const { navigate, page } = useRouter();
  const { isLoggedIn } = useAuth();

  const [ads, setAds] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('recent');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoriteBusyId, setFavoriteBusyId] = useState(null);

  const categoryOptions = useMemo(() => categories.map(getCategoryMeta), []);

  const loadHomeFeed = async () => {
    try {
      setLoading(true);
      setError(null);

      const [adsData, recommendedData] = await Promise.all([
        adsAPI.getAll(),
        adsAPI.getRecommended({ limit: 8 }).catch(() => []),
      ]);

      setAds(Array.isArray(adsData) ? adsData : []);
      setRecommendations(Array.isArray(recommendedData) ? recommendedData : []);
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить объявления');
      setAds([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeFeed();
  }, []);

  const applySearch = async (event) => {
    event?.preventDefault?.();

    try {
      setLoading(true);
      setError(null);

      const filters = {};

      if (query.trim()) filters.search = query.trim();
      if (categoryId) filters.category = categoryId;
      if (city.trim()) filters.city = city.trim();

      const data = await adsAPI.getAll(filters);
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Не удалось найти объявления');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (nextCategoryId) => {
    setCategoryId(nextCategoryId);
    if (page === 'home') {
      void adsAPI
        .getAll({
          search: query.trim() || undefined,
          category: nextCategoryId || undefined,
          city: city.trim() || undefined,
        })
        .then((data) => setAds(Array.isArray(data) ? data : []))
        .catch((err) => setError(err?.message || 'Не удалось загрузить категорию'));
    }
  };

  const handleOpenAd = (ad) => {
    navigate('ad-detail', { id: ad.id });
  };

  const toggleFavorite = async (ad) => {
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    const adId = ad?.id;
    if (!adId) return;

    const alreadyFavorite = favoriteIds.has(adId);

    try {
      setFavoriteBusyId(adId);
      if (alreadyFavorite) {
        await favoritesAPI.remove(adId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(adId);
          return next;
        });
      } else {
        await favoritesAPI.add(adId);
        setFavoriteIds((prev) => new Set(prev).add(adId));
      }
    } catch (err) {
      setError(err?.message || 'Не удалось обновить избранное');
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const filteredAds = useMemo(() => {
    const list = [...ads];

    if (activeQuickFilter === 'with_photo') {
      return list.filter((ad) => Boolean(getAdImage(ad)));
    }

    if (activeQuickFilter === 'budget') {
      return list.filter((ad) => Number(String(ad.price).replace(/[^\d.-]/g, '')) > 0 && Number(String(ad.price).replace(/[^\d.-]/g, '')) <= 50000);
    }

    if (activeQuickFilter === 'popular') {
      return list.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
    }

    return list.sort((a, b) => {
      const aTime = new Date(getPublishedAt(a) || 0).getTime();
      const bTime = new Date(getPublishedAt(b) || 0).getTime();
      return bTime - aTime;
    });
  }, [ads, activeQuickFilter]);

  const newAds = filteredAds.slice(0, 8);
  const popularAds = [...filteredAds].sort((a, b) => getPopularityScore(b) - getPopularityScore(a)).slice(0, 8);
  const recommendationSource = recommendations.length > 0 ? recommendations : filteredAds;
  const recommendedAds = [...recommendationSource]
    .filter((ad) => (activeQuickFilter === 'with_photo' ? Boolean(getAdImage(ad)) : true))
    .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
    .slice(0, 8);

  const sectionCount = filteredAds.length;

  return (
    <main className="lekofy-home">
      <section className="lekofy-hero">
        <div className="lekofy-hero__copy">
          <div className="lekofy-hero__eyebrow">
            <span className="lekofy-hero__eyebrow-dot" />
            Premium marketplace for Kyrgyzstan
          </div>

          <h1 className="lekofy-hero__title">
            Найдите нужное объявление или разместите свое за пару секунд
          </h1>

          <p className="lekofy-hero__subtitle">
            Lekofy объединяет поиск, доверие и удобную публикацию в одном премиальном
            интерфейсе без лишнего шума.
          </p>

          <form className="lekofy-search" onSubmit={applySearch}>
            <div className="lekofy-search__grid">
              <label className="lekofy-search__field">
                <span>Категория</span>
                <div className="lekofy-search__control">
                  <i className="fa-solid fa-layer-group" aria-hidden="true" />
                  <select value={categoryId} onChange={(event) => handleCategorySelect(event.target.value)}>
                    <option value="">Все категории</option>
                    {categoryOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="lekofy-search__field lekofy-search__field--wide">
                <span>Что ищете?</span>
                <div className="lekofy-search__control">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Автомобиль, квартира, смартфон..."
                    aria-label="Поиск по объявлениям"
                  />
                </div>
              </label>

              <label className="lekofy-search__field">
                <span>Город</span>
                <div className="lekofy-search__control">
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Бишкек"
                    aria-label="Город"
                  />
                </div>
              </label>
            </div>

            <div className="lekofy-search__footer">
              <div className="lekofy-chips" aria-label="Быстрые фильтры">
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`lekofy-chip ${activeQuickFilter === filter.id ? 'lekofy-chip--active' : ''}`}
                    onClick={() => setActiveQuickFilter(filter.id)}
                  >
                    <i className={`fa-solid ${filter.icon}`} aria-hidden="true" />
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>

              <div className="lekofy-search__actions">
                <button type="submit" className="lekofy-button lekofy-button--primary">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  Найти
                </button>
                <button
                  type="button"
                  className="lekofy-button lekofy-button--ghost"
                  onClick={() => {
                    setQuery('');
                    setCity('');
                    setCategoryId('');
                    setActiveQuickFilter('recent');
                    void loadHomeFeed();
                  }}
                >
                  Сбросить
                </button>
              </div>
            </div>
          </form>

          <div className="lekofy-hero__trustline">
            <span>
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              Проверенные продавцы
            </span>
            <span>
              <i className="fa-solid fa-bolt" aria-hidden="true" />
              Быстрый поиск
            </span>
            <span>
              <i className="fa-solid fa-shield-heart" aria-hidden="true" />
              Безопасные сделки
            </span>
          </div>
        </div>

        <MarketplaceVisual ads={filteredAds.length > 0 ? filteredAds : ads} featuredCount={sectionCount || ads.length} />
      </section>

      <section className="lekofy-section" id="categories">
        <div className="lekofy-section__head">
          <div>
            <p className="lekofy-kicker">Категории</p>
            <h2>Быстрый вход в самые востребованные разделы</h2>
          </div>
          <button type="button" className="lekofy-text-button" onClick={() => handleCategorySelect('')}>
            Все категории
          </button>
        </div>

        <div className="lekofy-category-grid">
          {categoryOptions.slice(0, 6).map((category) => {
            const active = categoryId === category.id;

            return (
              <button
                key={category.id}
                type="button"
                className={`lekofy-category-card ${active ? 'lekofy-category-card--active' : ''}`}
                onClick={() => handleCategorySelect(category.id)}
              >
                  <span className="lekofy-category-card__icon" style={{ background: category.accent }}>
                  <i className={`fa-solid ${category.icon}`} aria-hidden="true" />
                </span>
                <span className="lekofy-category-card__body">
                  <strong>{category.label}</strong>
                  <span>Перейти к объявлениям</span>
                </span>
                <i className="fa-solid fa-arrow-right lekofy-category-card__arrow" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="lekofy-section" id="new-ads">
        <div className="lekofy-section__head">
          <div>
            <p className="lekofy-kicker">Новые объявления</p>
            <h2>Свежая витрина, доступная уже на первом экране</h2>
          </div>
          <span className="lekofy-section__count">{sectionCount} результатов</span>
        </div>

        {loading && (
          <LoadingAnimation
            message="Загружаем объявления..."
            hint="Собираем свежие предложения и подстраиваем выдачу под вас"
          />
        )}
        {error && <div className="lekofy-state lekofy-state--error">{error}</div>}

        {!loading && !error && (
          <div className="lekofy-ad-grid">
            {newAds.map((ad) => (
              <ListingCard
                key={ad.id}
                ad={ad}
                onOpen={handleOpenAd}
                onFavorite={toggleFavorite}
                favoriteBusy={favoriteBusyId === ad.id}
                isFavorite={favoriteIds.has(ad.id)}
                onRequireAuth={!isLoggedIn ? () => navigate('login') : null}
              />
            ))}
          </div>
        )}
      </section>

      <section className="lekofy-section" id="popular-ads">
        <div className="lekofy-section__head">
          <div>
            <p className="lekofy-kicker">Популярные объявления</p>
            <h2>Объявления, которые привлекают больше всего внимания</h2>
          </div>
        </div>

        {!loading && !error && (
          <div className="lekofy-ad-grid">
            {popularAds.map((ad) => (
              <ListingCard
                key={ad.id}
                ad={ad}
                onOpen={handleOpenAd}
                onFavorite={toggleFavorite}
                favoriteBusy={favoriteBusyId === ad.id}
                isFavorite={favoriteIds.has(ad.id)}
                onRequireAuth={!isLoggedIn ? () => navigate('login') : null}
              />
            ))}
          </div>
        )}
      </section>

      <section className="lekofy-section">
        <div className="lekofy-section__head">
          <div>
            <p className="lekofy-kicker">Рекомендации</p>
            <h2>Подборка, которая выглядит как персональный concierge-сервис</h2>
          </div>
        </div>

        {!loading && !error && (
          <div className="lekofy-ad-grid">
            {recommendedAds.map((ad) => (
              <ListingCard
                key={ad.id}
                ad={ad}
                onOpen={handleOpenAd}
                onFavorite={toggleFavorite}
                favoriteBusy={favoriteBusyId === ad.id}
                isFavorite={favoriteIds.has(ad.id)}
                onRequireAuth={!isLoggedIn ? () => navigate('login') : null}
              />
            ))}
          </div>
        )}
      </section>

      <section className="lekofy-section" id="trust">
        <div className="lekofy-section__head">
          <div>
            <p className="lekofy-kicker">Доверие</p>
            <h2>Почему Lekofy выглядит как продукт с серьезными инвестициями</h2>
          </div>
        </div>

        <div className="lekofy-trust-grid">
          {TRUST_POINTS.map((point) => (
            <article key={point.title} className="lekofy-trust-card">
              <div className="lekofy-trust-card__icon">
                <i className={`fa-solid ${point.icon}`} aria-hidden="true" />
              </div>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lekofy-cta">
        <div>
          <p className="lekofy-kicker">Готовы начать?</p>
          <h2>Разместите объявление и получите внимание уже сегодня</h2>
          <p>
            Упрощенный путь публикации, чистая визуальная иерархия и уверенный premium-look.
          </p>
        </div>

        <button
          type="button"
          className="lekofy-button lekofy-button--primary"
          onClick={() => (isLoggedIn ? navigate('publish') : navigate('login'))}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Подать объявление
        </button>
      </section>
    </main>
  );
}

export default Home;
