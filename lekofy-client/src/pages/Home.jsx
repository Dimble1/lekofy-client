import { useEffect, useMemo, useRef, useState } from 'react';
import { adsAPI, favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { categories } from '../data/categories';
import '../styles/Home.css';

const POPULAR_SEARCHES = ['iPhone', 'Квартира', 'BMW', 'Ноутбук', 'PS5', 'Диван', 'Вакансии'];

const FOOTER_COLUMNS = [
  {
    title: 'Покупателям',
    items: ['Как купить', 'Безопасность', 'Доставка'],
  },
  {
    title: 'Продавцам',
    items: ['Как продать', 'Правила', 'Тарифы'],
  },
  {
    title: 'О компании',
    items: ['О нас', 'Контакты', 'Блог'],
  },
  {
    title: 'Помощь',
    items: ['FAQ', 'Поддержка', 'Пожаловаться'],
  },
];

const QUICK_FILTERS = [
  { id: 'recent', label: 'Сначала новые', icon: 'fa-bolt' },
  { id: 'popular', label: 'Популярные', icon: 'fa-fire-flame-curved' },
  { id: 'with_photo', label: 'С фото', icon: 'fa-image' },
  { id: 'budget', label: 'До 50 000 сом', icon: 'fa-wallet' },
];

const currencyFormatter = new Intl.NumberFormat('ru-RU');

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function parsePrice(value) {
  const numeric = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatPrice(value) {
  const numeric = parsePrice(value);
  if (!numeric) return 'Цена по запросу';
  return `${currencyFormatter.format(numeric)} сом`;
}

function formatRelative(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const deltaMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes} мин назад`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} ч назад`;
  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays} дн назад`;
}

function getImage(ad) {
  if (Array.isArray(ad?.images) && ad.images.length) return ad.images[0];
  return '';
}

function getCity(ad) {
  return ad?.city || ad?.location || ad?.district || 'Бишкек';
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


function uniqueById(list) {
  const seen = new Set();
  return list.filter((item) => {
    const key = item?.id;
    if (key == null || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesFilters(ad, query, city, categoryId) {
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

function HomeCardSkeleton() {
  return (
    <article className="home-card home-card--skeleton">
      <div className="home-card__media">
        <div className="home-skeleton home-skeleton--media" />
        <div className="home-skeleton home-skeleton--badge" />
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

function ListingCard({ ad, onOpen, onFavorite, favoriteBusy, isFavorite, premium = false }) {
  const image = getImage(ad);
  const city = getCity(ad);
  const publishedAt = getPublishedAt(ad);

  return (
    <article className={`home-card ${premium ? 'home-card--premium' : ''}`}>
      <button type="button" className="home-card__media" onClick={() => onOpen(ad)} aria-label={ad.title}>
        {image ? (
          <img src={image} alt={ad.title} />
        ) : (
          <div className="home-card__placeholder">
            <i className="fa-solid fa-image" aria-hidden="true" />
          </div>
        )}
        <div className="home-card__badge">
          <i className={`fa-solid ${premium ? 'fa-star' : 'fa-circle-check'}`} aria-hidden="true" />
          <span>{premium ? 'PREMIUM' : 'Проверено'}</span>
        </div>
        <div className="home-card__time">{formatRelative(publishedAt) || 'Сегодня'}</div>
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
        </div>
      </div>
    </article>
  );
}

function SectionHeader({ kicker, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="home-section__header">
      <div>
        <p className="home-section__kicker">{kicker}</p>
        <h2>{title}</h2>
        {subtitle ? <p className="home-section__subtitle">{subtitle}</p> : null}
      </div>
      {onAction ? (
        <button type="button" className="home-section__action" onClick={onAction}>
          {actionLabel || 'Смотреть все'}
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function Home() {
  const { navigate } = useRouter();
  const { isLoggedIn, user } = useAuth();
  const categoryRailRef = useRef(null);

  const [ads, setAds] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [categoryId, setCategoryId] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('recent');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [favoriteBusyId, setFavoriteBusyId] = useState(null);

  useEffect(() => {
    document.body.classList.add('home-view');
    return () => document.body.classList.remove('home-view');
  }, []);

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
        setRecommended(Array.isArray(recommendedData) ? recommendedData : []);
      } catch (loadError) {
        setError(loadError?.message || 'Не удалось загрузить объявления');
        setAds([]);
        setRecommended([]);
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

  const categoryCards = useMemo(
    () => categories.slice(0, 7).map((category) => ({
      ...category,
      count: ads.filter((ad) => normalizeText(ad?.category) === normalizeText(category.id)).length,
    })),
    [ads],
  );

  const visibleAds = useMemo(() => {
    const filtered = ads.filter((ad) => matchesFilters(ad, query, city, categoryId));

    switch (activeQuickFilter) {
      case 'popular':
        return [...filtered].sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
      case 'with_photo':
        return filtered.filter((ad) => getImage(ad));
      case 'budget':
        return filtered.filter((ad) => parsePrice(ad?.price) > 0 && parsePrice(ad?.price) <= 50000);
      case 'recent':
      default:
        return [...filtered].sort((a, b) => new Date(getPublishedAt(b) || 0) - new Date(getPublishedAt(a) || 0));
    }
  }, [ads, activeQuickFilter, categoryId, city, query]);

  const freshAds = useMemo(() => visibleAds.slice(0, 8), [visibleAds]);

  const heroAds = useMemo(() => uniqueById([...freshAds, ...recommended]).slice(0, 3), [freshAds, recommended]);

  const nearbyBuckets = useMemo(() => {
    const byCategory = new Map();

    for (const ad of ads) {
      const key = normalizeText(ad?.category);
      if (!key) continue;

      const list = byCategory.get(key) || [];
      list.push(ad);
      byCategory.set(key, list);
    }

    return categoryCards
      .map((category) => {
        const list = byCategory.get(category.id) || [];
        const topAd = [...list].sort((a, b) => getPopularityScore(b) - getPopularityScore(a))[0];
        return {
          id: category.id,
          title: category.label,
          count: `${list.length || 0} объявлений`,
          icon: category.icon,
          image: getImage(topAd),
        };
      })
      .filter((bucket) => bucket.count !== '0 объявлений')
      .slice(0, 6);
  }, [ads, categoryCards]);

  const topCity = useMemo(() => {
    const counts = new Map();
    for (const ad of ads) {
      const name = getCity(ad);
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    let best = 'Бишкек';
    let max = 0;
    for (const [name, count] of counts.entries()) {
      if (count > max) {
        best = name;
        max = count;
      }
    }
    return best;
  }, [ads]);

  const handleOpenAd = (ad) => {
    if (!ad?.id) return;
    navigate('ad-detail', { id: ad.id });
  };

  const handleFavorite = async (ad) => {
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setQuery(draftQuery.trim());
  };

  const clearFilters = () => {
    setDraftQuery('');
    setQuery('');
    setCity('Бишкек');
    setCategoryId('');
    setActiveQuickFilter('recent');
  };

  const scrollCategories = (direction) => {
    const node = categoryRailRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <h1 className="home-hero__title">
            Найдите всё,
            <br />
            что нужно
            <br />
            <span>рядом с вами</span>
          </h1>

          <p className="home-hero__subtitle">
            Тысячи объявлений от проверенных пользователей каждый день
          </p>

          <form className="home-search" onSubmit={handleSearchSubmit}>
            <div className="home-search__field home-search__field--wide">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                value={draftQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraftQuery(value);
                  setQuery(value);
                }}
                placeholder="Поиск объявлений..."
                aria-label="Поиск по объявлениям"
              />
            </div>

            <div className="home-search__field">
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </div>

            <div className="home-search__field">
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="Бишкек">Бишкек</option>
                <option value="Ош">Ош</option>
                <option value="Джалал-Абад">Джалал-Абад</option>
                <option value="Каракол">Каракол</option>
                <option value="Токмок">Токмок</option>
                <option value="Нарын">Нарын</option>
              </select>
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </div>

            <button type="submit" className="home-search__button">
              Найти
            </button>
          </form>

          <div className="home-popular">
            <span>Популярные запросы:</span>
            <div className="home-popular__chips">
              {POPULAR_SEARCHES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="home-popular__chip"
                  onClick={() => {
                    setDraftQuery(item);
                    setQuery(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="home-hero__art" aria-hidden="true">
          <div className="home-hero__art-glow" />
          <div className="home-hero__art-item home-hero__art-item--chair">
            {heroAds[0]?.images?.[0] ? <img src={heroAds[0].images[0]} alt="" /> : <i className="fa-solid fa-couch" />}
          </div>
          <div className="home-hero__art-item home-hero__art-item--plant">
            {heroAds[1]?.images?.[0] ? <img src={heroAds[1].images[0]} alt="" /> : <i className="fa-solid fa-seedling" />}
          </div>
          <div className="home-hero__art-item home-hero__art-item--car">
            {heroAds[2]?.images?.[0] ? <img src={heroAds[2].images[0]} alt="" /> : <i className="fa-solid fa-car-side" />}
          </div>
        </div>
      </section>

      <section className="home-categories" id="categories">
        <div className="home-categories__head">
          <button type="button" className="home-rail-arrow" onClick={() => scrollCategories(-1)} aria-label="Прокрутить категории влево">
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>

          <div className="home-category-rail" ref={categoryRailRef}>
            {(categoryCards.length ? categoryCards : categories.slice(0, 7)).map((category) => {
              const active = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`home-category-card ${active ? 'is-active' : ''}`}
                  onClick={() => setCategoryId(active ? '' : category.id)}
                >
                  <span className="home-category-card__icon">
                    <i className={`fa-solid ${category.icon || 'fa-layer-group'}`} aria-hidden="true" />
                  </span>
                  <span className="home-category-card__label">{category.label}</span>
                </button>
              );
            })}
          </div>

          <button type="button" className="home-rail-arrow" onClick={() => scrollCategories(1)} aria-label="Прокрутить категории вправо">
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="home-section" id="fresh">
        <SectionHeader
          kicker="Свежие объявления"
          title="Свежие объявления"
          subtitle="Новое каждый день"
          actionLabel="Смотреть все"
          onAction={() => navigate('home')}
        />

        {error ? <div className="home-state home-state--error">{error}</div> : null}

        <div className="home-grid">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <HomeCardSkeleton key={index} />)
            : freshAds.map((ad) => (
                <ListingCard
                  key={ad.id}
                  ad={ad}
                  onOpen={handleOpenAd}
                  onFavorite={handleFavorite}
                  favoriteBusy={favoriteBusyId === ad.id}
                  isFavorite={favoriteIds.has(ad.id)}
                />
              ))}
        </div>
      </section>

      <section className="home-section" id="nearby">
        <SectionHeader
          kicker="Популярно рядом с вами"
          title={`Популярно рядом с вами`}
          subtitle={`Смотрят чаще всего в ${city || topCity}`}
          actionLabel="Смотреть все"
          onAction={() => navigate('home')}
        />

        <div className="home-nearby">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="home-nearby__card home-nearby__card--skeleton">
                  <div className="home-skeleton home-skeleton--nearby-thumb" />
                  <div className="home-nearby__copy">
                    <div className="home-skeleton home-skeleton--line" />
                    <div className="home-skeleton home-skeleton--line home-skeleton--short" />
                  </div>
                </div>
              ))
            : nearbyBuckets.map((bucket) => (
                <button key={bucket.id} type="button" className="home-nearby__card">
                  <div className="home-nearby__thumb">
                    {bucket.image ? <img src={bucket.image} alt="" /> : <i className={`fa-solid ${bucket.icon}`} aria-hidden="true" />}
                  </div>
                  <div className="home-nearby__copy">
                    <strong>{bucket.title}</strong>
                    <span>{bucket.count}</span>
                  </div>
                </button>
              ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer__brand">
          <img src="/lekofy-logo.svg" alt="Lekofy" className="home-footer__logo" />
          <p>Маркетплейс объявлений для всего Кыргызстана</p>
          <div className="home-footer__socials" aria-label="Социальные сети">
            <span><i className="fa-brands fa-telegram" /></span>
            <span><i className="fa-brands fa-instagram" /></span>
            <span><i className="fa-brands fa-youtube" /></span>
          </div>
        </div>

        <div className="home-footer__columns">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="home-footer__column">
              <h3>{column.title}</h3>
              {column.items.map((item) => (
                <button key={item} type="button">{item}</button>
              ))}
            </div>
          ))}
        </div>
      </footer>

      <div className="home-footer__legal">
        <span>© 2024 Lekofy. Все права защищены</span>
        <a href="#fresh">Пользовательское соглашение</a>
        <a href="#fresh">Политика конфиденциальности</a>
      </div>
    </main>
  );
}

export default Home;
