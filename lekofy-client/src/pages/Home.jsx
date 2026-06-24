import { useEffect, useMemo, useState } from 'react';
import { adsAPI, favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { categories } from '../data/categories';
import '../styles/Home.css';

const POPULAR_SEARCHES = ['iPhone', 'BMW', 'Квартира', 'Ноутбук', 'Диван', 'Работа'];

const QUICK_FILTERS = [
  { id: 'recent', label: 'Сначала новые', icon: 'fa-bolt' },
  { id: 'popular', label: 'Популярные', icon: 'fa-fire-flame-curved' },
  { id: 'with_photo', label: 'С фото', icon: 'fa-image' },
  { id: 'budget', label: 'До 50 000 сом', icon: 'fa-wallet' },
];

const currencyFormatter = new Intl.NumberFormat('ru-RU');

function parsePrice(value) {
  const numeric = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatPrice(value) {
  const numeric = parsePrice(value);
  if (!numeric) return 'Цена по запросу';
  return `${currencyFormatter.format(numeric)} сом`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
}

function getImage(ad) {
  if (Array.isArray(ad?.images) && ad.images.length) return ad.images[0];
  return '';
}

function getCity(ad) {
  return ad?.city || ad?.location || ad?.district || 'Кыргызстан';
}

function getPublishedAt(ad) {
  return ad?.createdAt || ad?.publishedAt || ad?.updatedAt || ad?.date || null;
}

function getPopularityScore(ad) {
  return (
    Number(ad?.viewsCount || ad?.views || 0)
    + Number(ad?.favoritesCount || ad?.favorites || 0) * 2
    + Number(ad?.rating || 0) * 10
    + Number(ad?.featured || ad?.premium || ad?.isPremium ? 40 : 0)
  );
}

function isPremiumAd(ad) {
  return Boolean(ad?.featured || ad?.premium || ad?.isPremium || ad?.boosted);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueById(list) {
  const seen = new Set();
  return list.filter((item) => {
    const key = item?.id;
    if (key == null || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchSearch(ad, query, city, categoryId) {
  const normalizedQuery = normalizeText(query);
  const normalizedCity = normalizeText(city);
  const adCity = normalizeText(getCity(ad));
  const haystack = [
    ad?.title,
    ad?.description,
    ad?.category,
    ad?.brand,
    ad?.model,
    adCity,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const categoryMatch = !categoryId || normalizeText(ad?.category) === normalizeText(categoryId);
  const cityMatch = !normalizedCity || adCity.includes(normalizedCity);
  const textMatch = !normalizedQuery || haystack.includes(normalizedQuery);

  return categoryMatch && cityMatch && textMatch;
}

function getCategoryIcon(categoryId) {
  const iconByCategory = {
    cars: 'fa-car-side',
    electronics: 'fa-mobile-screen',
    real_estate: 'fa-house',
    clothing: 'fa-shirt',
    services: 'fa-screwdriver-wrench',
    jobs: 'fa-briefcase',
    home_garden: 'fa-seedling',
    sports: 'fa-person-running',
    kids: 'fa-baby',
    pets: 'fa-paw',
  };

  return iconByCategory[categoryId] || 'fa-layer-group';
}

function getCategoryStats(ads) {
  const counts = new Map();
  for (const ad of ads) {
    const key = normalizeText(ad?.category);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return categories
    .map((category) => ({
      ...category,
      icon: category.icon || getCategoryIcon(category.id),
      count: counts.get(category.id) || 0,
    }))
    .filter((category) => category.count > 0)
    .slice(0, 8);
}

function HomeCardSkeleton({ compact = false }) {
  return (
    <article className={`home-card home-card--skeleton ${compact ? 'home-card--compact' : ''}`}>
      <div className="home-card__media">
        <div className="home-skeleton home-skeleton--media" />
        <div className="home-skeleton-pill" />
      </div>
      <div className="home-card__body">
        <div className="home-skeleton home-skeleton--price" />
        <div className="home-skeleton home-skeleton--title" />
        <div className="home-skeleton home-skeleton--text" />
        <div className="home-skeleton home-skeleton--text home-skeleton--short" />
      </div>
    </article>
  );
}

function HomeCard({
  ad,
  onOpen,
  onFavorite,
  favoriteBusy,
  isFavorite,
  premium = false,
  compact = false,
}) {
  const image = getImage(ad);
  const city = getCity(ad);
  const publishedAt = getPublishedAt(ad);

  return (
    <article className={`home-card ${premium ? 'home-card--premium' : ''} ${compact ? 'home-card--compact' : ''}`}>
      <button type="button" className="home-card__media" onClick={() => onOpen(ad)} aria-label={ad.title}>
        {image ? <img src={image} alt={ad.title} /> : <div className="home-card__placeholder">Нет фото</div>}
        <div className="home-card__chip">
          <i className={`fa-solid ${premium ? 'fa-star' : 'fa-circle-check'}`} aria-hidden="true" />
          <span>{premium ? 'Premium' : 'Проверено'}</span>
        </div>
        <div className="home-card__time">{formatDate(publishedAt) || 'Сегодня'}</div>
      </button>

      <div className="home-card__body">
        <div className="home-card__topline">
          <div className="home-card__price">{formatPrice(ad.price)}</div>
          <button
            type="button"
            className={`home-favorite ${isFavorite ? 'home-favorite--active' : ''}`}
            disabled={favoriteBusy}
            onClick={() => onFavorite(ad)}
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <i className={`fa-${isFavorite ? 'solid' : 'regular'} fa-heart`} aria-hidden="true" />
          </button>
        </div>

        <button type="button" className="home-card__title" onClick={() => onOpen(ad)}>
          {ad.title}
        </button>

        <div className="home-card__meta">
          <span>
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {city}
          </span>
          {ad?.description ? <p>{ad.description}</p> : null}
        </div>
      </div>
    </article>
  );
}

function SectionHeader({ kicker, title, subtitle, action, actionLabel }) {
  return (
    <div className="home-section__header">
      <div>
        {kicker ? <p className="home-section__kicker">{kicker}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <p className="home-section__subtitle">{subtitle}</p> : null}
      </div>
      {action ? (
        <button type="button" className="home-section__action" onClick={action}>
          {actionLabel || 'Смотреть все'}
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function Home() {
  const { navigate } = useRouter();
  const { isLoggedIn } = useAuth();

  const [ads, setAds] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('recent');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoriteBusyId, setFavoriteBusyId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [adsData, recommendedData] = await Promise.all([
          adsAPI.getAll().catch(() => []),
          adsAPI.getRecommended({ limit: 10 }).catch(() => []),
        ]);

        setAds(Array.isArray(adsData) ? adsData : []);
        setRecommendations(Array.isArray(recommendedData) ? recommendedData : []);
      } catch (loadError) {
        setError(loadError?.message || 'Не удалось загрузить объявления');
        setAds([]);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!isLoggedIn) {
        setFavoriteIds(new Set());
        return;
      }

      try {
        const data = await favoritesAPI.getAll();
        const ids = new Set((Array.isArray(data) ? data : []).map((ad) => ad?.id).filter((id) => id != null));
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds(new Set());
      }
    };

    loadFavorites();
  }, [isLoggedIn]);

  const categoryStats = useMemo(() => getCategoryStats(ads), [ads]);

  const visibleAds = useMemo(() => {
    const list = ads.filter((ad) => matchSearch(ad, query, city, categoryId));

    switch (activeQuickFilter) {
      case 'popular':
        return [...list].sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
      case 'with_photo':
        return list.filter((ad) => getImage(ad));
      case 'budget':
        return list.filter((ad) => parsePrice(ad?.price) > 0 && parsePrice(ad?.price) <= 50000);
      case 'recent':
      default:
        return [...list].sort((a, b) => new Date(getPublishedAt(b) || 0) - new Date(getPublishedAt(a) || 0));
    }
  }, [activeQuickFilter, ads, categoryId, city, query]);

  const freshAds = useMemo(() => visibleAds.slice(0, 8), [visibleAds]);

  const premiumAds = useMemo(() => {
    const premiumPool = ads.filter(isPremiumAd);
    const fallbackPool = [...ads]
      .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
      .slice(0, 6);
    return uniqueById([...premiumPool, ...fallbackPool]).slice(0, 6);
  }, [ads]);

  const topCity = useMemo(() => {
    const cities = new Map();
    for (const ad of ads) {
      const key = getCity(ad);
      cities.set(key, (cities.get(key) || 0) + 1);
    }

    let winner = '';
    let max = 0;
    for (const [name, count] of cities.entries()) {
      if (count > max) {
        winner = name;
        max = count;
      }
    }

    return winner || 'рядом';
  }, [ads]);

  const nearbyAds = useMemo(() => {
    const source = recommendations.length ? recommendations : ads;
    const normalizedCity = normalizeText(city || topCity);
    const list = source.filter((ad) => normalizeText(getCity(ad)).includes(normalizedCity));
    const fallback = uniqueById([...list, ...source]).sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
    return fallback.slice(0, 8);
  }, [ads, city, recommendations, topCity]);

  const heroStats = useMemo(
    () => [
      { label: 'Объявлений сейчас', value: ads.length },
      { label: 'Премиум в подборке', value: premiumAds.length },
      { label: 'Город в фокусе', value: city || topCity || 'Все' },
    ],
    [ads.length, city, premiumAds.length, topCity],
  );

  const heroPreview = useMemo(() => freshAds.slice(0, 3), [freshAds]);

  const handleOpenAd = (ad) => {
    if (!ad?.id) return;
    navigate('ad-detail', { id: ad.id });
  };

  const toggleFavorite = async (ad) => {
    if (!ad?.id) return;

    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    if (favoriteBusyId) return;

    try {
      setFavoriteBusyId(ad.id);
      if (favoriteIds.has(ad.id)) {
        await favoritesAPI.remove(ad.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(ad.id);
          return next;
        });
      } else {
        await favoritesAPI.add(ad.id);
        setFavoriteIds((prev) => new Set(prev).add(ad.id));
      }
    } catch (toggleError) {
      window.alert(toggleError?.message || 'Не удалось изменить избранное');
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const applySearch = (event) => {
    event.preventDefault();
    setQuery(draftQuery.trim());
  };

  const clearFilters = () => {
    setDraftQuery('');
    setQuery('');
    setCity('');
    setCategoryId('');
    setActiveQuickFilter('recent');
  };

  const setPopularSearch = (value) => {
    setDraftQuery(value);
    setQuery(value);
  };

  return (
    <main className="home-page-v2">
      <section className="home-hero-v2">
        <div className="home-hero-v2__copy">
          <div className="home-hero-v2__eyebrow">
            <span className="home-hero-v2__eyebrow-dot" />
            Lekofy marketplace
          </div>

          <h1>Найдите нужное быстро. Сразу по живым объявлениям.</h1>
          <p className="home-hero-v2__subtitle">
            Спрос, новые публикации и премиальные предложения собраны в одном экране.
            Поиск работает первым, а карточки сразу показывают активность площадки.
          </p>

          <form className="home-search-v2" onSubmit={applySearch}>
            <div className="home-search-v2__field home-search-v2__field--wide">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                value={draftQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraftQuery(value);
                  setQuery(value);
                }}
                placeholder="Искать iPhone, BMW, квартиру..."
                aria-label="Поиск по объявлениям"
              />
            </div>

            <div className="home-search-v2__field">
              <i className="fa-solid fa-layer-group" aria-hidden="true" />
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="home-search-v2__field">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Город"
                aria-label="Город"
              />
            </div>

            <button type="submit" className="home-search-v2__button">
              Найти
            </button>
          </form>

          <div className="home-popular-searches">
            <span>Популярные запросы</span>
            <div className="home-popular-searches__chips">
              {POPULAR_SEARCHES.map((item) => (
                <button key={item} type="button" onClick={() => setPopularSearch(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="home-hero-v2__quick">
            <button type="button" className="home-hero-v2__reset" onClick={clearFilters}>
              Сбросить фильтры
            </button>
            <div className="home-hero-v2__chips">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`home-pill ${activeQuickFilter === filter.id ? 'home-pill--active' : ''}`}
                  onClick={() => setActiveQuickFilter(filter.id)}
                >
                  <i className={`fa-solid ${filter.icon}`} aria-hidden="true" />
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="home-hero-v2__panel">
          <div className="home-hero-v2__panel-head">
            <div>
              <p>Пульс площадки</p>
              <strong>{ads.length}</strong>
              <span>активных объявлений</span>
            </div>
            <div className="home-hero-v2__badge">
              <i className="fa-solid fa-bolt" aria-hidden="true" />
              Live feed
            </div>
          </div>

          <div className="home-hero-v2__stats">
            {heroStats.map((stat) => (
              <div key={stat.label} className="home-hero-v2__stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="home-hero-v2__preview-list">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="home-hero-v2__preview home-hero-v2__preview--skeleton">
                    <div className="home-skeleton home-skeleton--thumb" />
                    <div className="home-hero-v2__preview-copy">
                      <div className="home-skeleton home-skeleton--line" />
                      <div className="home-skeleton home-skeleton--line home-skeleton--short" />
                    </div>
                  </div>
                ))
              : heroPreview.map((ad) => (
                  <button
                    key={ad.id}
                    type="button"
                    className="home-hero-v2__preview"
                    onClick={() => handleOpenAd(ad)}
                  >
                    {getImage(ad) ? (
                      <img src={getImage(ad)} alt={ad.title} />
                    ) : (
                      <span className="home-hero-v2__preview-fallback">•</span>
                    )}
                    <div className="home-hero-v2__preview-copy">
                      <strong>{ad.title}</strong>
                      <span>{formatPrice(ad.price)}</span>
                    </div>
                  </button>
                ))}
          </div>
        </aside>
      </section>

      <section className="home-section-v2 home-section-v2--categories">
        <SectionHeader
          kicker="Категории"
          title="Быстрый переход к самым востребованным разделам"
          subtitle="Короткая горизонтальная навигация вместо крупной карточной стены."
        />

        <div className="home-category-rail" role="navigation" aria-label="Категории">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="home-category-rail__item home-category-rail__item--skeleton">
                  <div className="home-skeleton home-skeleton--icon" />
                  <div className="home-skeleton home-skeleton--label" />
                </div>
              ))
            : categoryStats.length
              ? categoryStats.map((category) => {
                  const active = categoryId === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`home-category-rail__item ${active ? 'is-active' : ''}`}
                      onClick={() => setCategoryId(active ? '' : category.id)}
                    >
                      <span className="home-category-rail__icon">
                        <i className={`fa-solid ${category.icon}`} aria-hidden="true" />
                      </span>
                      <span className="home-category-rail__label">{category.label}</span>
                      <span className="home-category-rail__count">{category.count}</span>
                    </button>
                  );
                })
              : categories.slice(0, 8).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`home-category-rail__item ${categoryId === category.id ? 'is-active' : ''}`}
                    onClick={() => setCategoryId(categoryId === category.id ? '' : category.id)}
                  >
                    <span className="home-category-rail__icon">
                      <i className={`fa-solid ${category.icon || 'fa-layer-group'}`} aria-hidden="true" />
                    </span>
                    <span className="home-category-rail__label">{category.label}</span>
                    <span className="home-category-rail__count">0</span>
                  </button>
                ))}
        </div>
      </section>

      <section className="home-section-v2 home-section-v2--fresh" id="fresh">
        <SectionHeader
          kicker="Свежие объявления"
          title="Первые карточки видны сразу на первом экране"
          subtitle={`${freshAds.length} объявлений в текущем фильтре`}
          action={() => setActiveQuickFilter('recent')}
          actionLabel="Сначала новые"
        />

        {error ? <div className="home-state home-state--error">{error}</div> : null}

        <div className="home-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => <HomeCardSkeleton key={index} />)
            : freshAds.map((ad) => (
                <HomeCard
                  key={ad.id}
                  ad={ad}
                  onOpen={handleOpenAd}
                  onFavorite={toggleFavorite}
                  favoriteBusy={favoriteBusyId === ad.id}
                  isFavorite={favoriteIds.has(ad.id)}
                />
              ))}
        </div>
      </section>

      <section className="home-section-v2 home-section-v2--premium" id="premium">
        <SectionHeader
          kicker="Premium"
          title="Выделенные предложения с более сильной подачей"
          subtitle="Эта зона визуально отличается, но не перегружает ленту."
        />

        <div className="home-grid home-grid--premium">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <HomeCardSkeleton key={index} />)
            : premiumAds.map((ad) => (
                <HomeCard
                  key={ad.id}
                  ad={ad}
                  premium
                  onOpen={handleOpenAd}
                  onFavorite={toggleFavorite}
                  favoriteBusy={favoriteBusyId === ad.id}
                  isFavorite={favoriteIds.has(ad.id)}
                />
              ))}
        </div>
      </section>

      <section className="home-section-v2 home-section-v2--nearby" id="nearby">
        <SectionHeader
          kicker="Популярно рядом"
          title={`Что чаще всего смотрят в ${city || topCity}`}
          subtitle="Карточки идут горизонтально на мобильных и не ломают плотность экрана."
        />

        <div className="home-nearby-row">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="home-nearby-row__item home-nearby-row__item--skeleton">
                  <div className="home-skeleton home-skeleton--nearby-thumb" />
                  <div className="home-nearby-row__copy">
                    <div className="home-skeleton home-skeleton--line" />
                    <div className="home-skeleton home-skeleton--line home-skeleton--short" />
                  </div>
                </div>
              ))
            : nearbyAds.map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  className="home-nearby-row__item"
                  onClick={() => handleOpenAd(ad)}
                >
                  <div className="home-nearby-row__thumb">
                    {getImage(ad) ? <img src={getImage(ad)} alt={ad.title} /> : <span>•</span>}
                  </div>
                  <div className="home-nearby-row__copy">
                    <strong>{ad.title}</strong>
                    <span>{getCity(ad)}</span>
                    <small>{formatPrice(ad.price)}</small>
                  </div>
                </button>
              ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
