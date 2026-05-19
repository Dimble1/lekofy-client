import { useEffect, useMemo, useState } from 'react';
import { adsAPI, favoritesAPI, chatAPI, profileAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { categories } from '../data/categories';
import '../styles/AdDetail.css';

const FavoriteIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 21s-6.7-4.35-9.33-8.2A5.73 5.73 0 0 1 12 5.1a5.73 5.73 0 0 1 9.33 7.7C18.7 16.65 12 21 12 21z"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M7 12a3 3 0 1 0-2.83-4h-.34a3 3 0 0 0 0 6h.34A3 3 0 0 0 7 12zm10 10a3 3 0 1 0-2.83-4h-.34a3 3 0 0 0 0 6h.34A3 3 0 0 0 17 22zm0-20a3 3 0 1 0-2.83 4h-.34a3 3 0 0 0 0-6h.34A3 3 0 0 0 17 2zM8.9 11.2l6.2-3.45m-6.2 5.05 6.2 3.45"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M21 14a4 4 0 0 1-4 4H8l-5 4V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22 16.92v2.3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.8 5.18 2 2 0 0 1 5.78 3h2.31a2 2 0 0 1 2 1.72c.12.9.32 1.78.59 2.62a2 2 0 0 1-.45 2.11l-.98.98a16 16 0 0 0 6.53 6.53l.98-.98a2 2 0 0 1 2.11-.45c.84.27 1.72.47 2.62.59A2 2 0 0 1 22 16.92z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 22s7-6.04 7-12a7 7 0 1 0-14 0c0 5.96 7 12 7 12z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ViewIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m5 12 4.2 4.2L19 6.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function AdDetail({ adId }) {
  const { navigate } = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sellerProfile, setSellerProfile] = useState(null);

  useEffect(() => {
    if (!adId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setSellerProfile(null);
        const data = await adsAPI.getById(adId);
        setAd(data);
        setActiveImageIndex(0);

        if (isLoggedIn) {
          const favs = await favoritesAPI.getAll();
          if (Array.isArray(favs)) {
            setIsFavorite(favs.some((item) => item && item.id === data.id));
          }
        }

        if (data.category) {
          const rec = await adsAPI.getRecommended({
            category: data.category,
            city: data.city,
            excludeId: data.id,
            limit: 8,
          });
          setSimilar(Array.isArray(rec) ? rec : []);
        }
      } catch (loadError) {
        setError(loadError.message || 'Ошибка загрузки объявления');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [adId, isLoggedIn]);

  useEffect(() => {
    const loadSellerProfile = async () => {
      const sellerId =
        ad?.User?.id
        || ad?.user?.id
        || ad?.seller?.id
        || ad?.authorId
        || ad?.userId;

      if (!sellerId) {
        setSellerProfile(null);
        return;
      }

      try {
        const profileData = await profileAPI.getById(sellerId);
        setSellerProfile(profileData?.user || null);
      } catch {
        setSellerProfile(null);
      }
    };

    loadSellerProfile();
  }, [ad?.User?.id, ad?.authorId, ad?.seller?.id, ad?.user?.id, ad?.userId]);

  const toggleFavorite = async () => {
    if (!isLoggedIn || !ad) {
      navigate('login');
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoritesAPI.remove(ad.id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(ad.id);
        setIsFavorite(true);
      }
    } finally {
      setFavLoading(false);
    }
  };

  const startChat = async () => {
    if (!isLoggedIn || !user || !ad) {
      navigate('login');
      return;
    }

    if (Number(ad.userId) === Number(user.id)) {
      window.alert('Нельзя написать самому себе по своему объявлению.');
      return;
    }

    const chat = await chatAPI.create(ad.userId, ad.id);
    navigate('chat-window', { chatId: chat.id, title: ad.title });
  };

  const sendReport = async () => {
    if (!isLoggedIn || !ad) {
      navigate('login');
      return;
    }

    const reason = window.prompt('Опишите причину жалобы');
    if (!reason) return;

    await adsAPI.report(ad.id, reason);
    window.alert('Жалоба отправлена модераторам.');
  };

  const category = categories.find((item) => item.id === ad?.category);

  const meta = useMemo(() => {
    const rawMeta = ad?.meta;
    if (rawMeta && typeof rawMeta === 'object' && !Array.isArray(rawMeta)) {
      return rawMeta;
    }

    if (typeof rawMeta === 'string') {
      try {
        const parsed = JSON.parse(rawMeta);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return {};
      }
    }

    return {};
  }, [ad]);

  const fieldByName = useMemo(
    () => new Map((category?.extraFields || []).map((field) => [field.name, field])),
    [category]
  );

  const prettyLabelByKey = {
    fuel_type: 'Тип двигателя',
    transmission: 'Коробка передач',
    drive_type: 'Привод',
    engine_volume: 'Объем двигателя',
    steering_wheel: 'Руль',
    payment_type: 'Тип расчета',
    mileage: 'Пробег',
    year: 'Год выпуска',
    purchaseYear: 'Год покупки',
    condition: 'Состояние',
  };

  const valueMapByKey = {
    fuel_type: {
      petrol: 'Бензин',
      diesel: 'Дизель',
      hybrid: 'Гибрид',
      electric: 'Электро',
    },
    transmission: {
      manual: 'Механика',
      automatic: 'Автомат',
      cvt: 'Вариатор',
    },
    drive_type: {
      front: 'Передний',
      rear: 'Задний',
      awd: 'Полный',
    },
    steering_wheel: {
      left: 'Левый',
      right: 'Правый',
    },
    payment_type: {
      cash: 'Наличные',
      cashless: 'Безналичный',
      exchange: 'Обмен',
      installment: 'Рассрочка',
    },
    country: {
      kg: 'Кыргызстан',
      kz: 'Казахстан',
      ru: 'Россия',
      am: 'Армения',
    },
  };

  const formatLabel = (key) => {
    const field = fieldByName.get(key);
    if (field?.label) return field.label;
    if (prettyLabelByKey[key]) return prettyLabelByKey[key];

    return String(key)
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (letter) => letter.toUpperCase());
  };

  const formatValue = (key, value) => {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);

    const strValue = String(value).trim();
    if (!strValue) return '';

    const field = fieldByName.get(key);
    if (field?.options && Array.isArray(field.options)) {
      const option = field.options.find(
        (opt) => String(opt).toLowerCase() === strValue.toLowerCase()
      );
      if (option) return option;
    }

    return valueMapByKey[key]?.[strValue] || strValue;
  };

  const formatPrice = (value) => `${Number(value || 0).toLocaleString('ru-RU')} сом`;

  const formatDate = (value) => {
    if (!value) return 'Дата публикации неизвестна';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return 'Дата публикации неизвестна';
    return parsedDate.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const safeImages = Array.isArray(ad?.images) ? ad.images.filter(Boolean) : [];

  const descriptionText = (ad?.description && String(ad.description).trim())
    || (meta.description && String(meta.description).trim())
    || (meta.desc && String(meta.desc).trim())
    || 'Описание не указано';

  const excludedMetaKeys = new Set([
    'description',
    'desc',
    'title',
    'price',
    'city',
    'phone',
    'images',
    'category',
  ]);

  const criteriaItems = Object.keys(meta)
    .filter((key) => !excludedMetaKeys.has(key))
    .map((key) => ({
      key,
      label: formatLabel(key),
      value: formatValue(key, meta[key]),
    }))
    .filter((item) => item.value);

  const sellerName =
    sellerProfile?.name
    || ad?.User?.name
    || ad?.user?.name
    || ad?.seller?.name
    || ad?.authorName
    || (ad?.userId ? `Пользователь #${ad.userId}` : 'Пользователь');

  const sellerId =
    ad?.User?.id
    || ad?.user?.id
    || ad?.seller?.id
    || ad?.authorId
    || ad?.userId
    || null;

  const sellerAvatar =
    sellerProfile?.avatarUrl
    || sellerProfile?.avatar
    || ad?.User?.avatarUrl
    || ad?.User?.avatar
    || ad?.user?.avatarUrl
    || ad?.user?.avatar
    || ad?.seller?.avatarUrl
    || ad?.seller?.avatar
    || '';

  const sellerJoined = formatDate(
    sellerProfile?.createdAt
    || ad?.User?.createdAt
    || ad?.user?.createdAt
    || ad?.seller?.createdAt
  );

  const openSellerProfile = () => {
    if (!sellerId) return;
    navigate('profile', { userId: String(sellerId) });
  };

  if (!adId) {
    return <div className="ad-detail-status">Некорректный идентификатор объявления.</div>;
  }

  if (loading) {
    return <div className="ad-detail-status">Загружаем объявление...</div>;
  }

  if (error || !ad) {
    return <div className="ad-detail-status ad-detail-status-error">{error || 'Объявление не найдено'}</div>;
  }

  return (
    <section className="ad-detail-page">
      <div className="ad-detail-shell">
        <button className="ad-detail-back" onClick={() => navigate('home')}>
          ← Назад к объявлениям
        </button>

        <div className="ad-detail-grid">
          <div className="ad-detail-main">
            <div className="ad-detail-gallery">
              {safeImages.length > 0 ? (
                <>
                  <div className="ad-detail-main-image-wrap">
                    <img
                      src={safeImages[activeImageIndex]}
                      alt={ad.title}
                      className="ad-detail-main-image"
                    />
                  </div>

                  {safeImages.length > 1 && (
                    <div className="ad-detail-thumbs">
                      {safeImages.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          className={`ad-detail-thumb ${index === activeImageIndex ? 'is-active' : ''}`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img src={image} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="ad-detail-empty-image">Нет фото</div>
              )}
            </div>

            <article className="ad-detail-content-card">
              <div className="ad-detail-title-row">
                <div>
                  <h1>{ad.title}</h1>
                  <div className="ad-detail-meta-row">
                    <span>{formatDate(ad.createdAt)}</span>
                    <span className="ad-detail-meta-dot">•</span>
                    <span className="ad-detail-inline-icon"><ViewIcon /> {ad.views || 0} просмотров</span>
                    {ad.city && (
                      <>
                        <span className="ad-detail-meta-dot">•</span>
                        <span className="ad-detail-inline-icon"><LocationIcon /> {ad.city}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="ad-detail-actions">
                  <button
                    type="button"
                    className="ad-detail-icon-btn"
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
                  >
                    <FavoriteIcon active={isFavorite} />
                  </button>
                  <button
                    type="button"
                    className="ad-detail-share-btn"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: ad.title, text: ad.title }).catch(() => {});
                      }
                    }}
                    title="Поделиться объявлением"
                  >
                    <ShareIcon />
                    <span>Поделиться</span>
                  </button>
                </div>
              </div>

              <p className="ad-detail-description">{descriptionText}</p>

              {criteriaItems.length > 0 && (
                <div className="ad-detail-criteria">
                  <h3>Характеристики</h3>
                  <div className="ad-detail-criteria-grid">
                    {criteriaItems.map((item) => (
                      <div key={item.key} className="ad-detail-criteria-item">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ad.category && (
                <div className="ad-detail-chip-row">
                  <span className="ad-detail-chip">
                    Категория: {category?.label || ad.category}
                  </span>
                </div>
              )}
            </article>
          </div>

          <aside className="ad-detail-sidebar">
            <div className="ad-detail-price-card">
              <div className="ad-detail-price">{formatPrice(ad.price)}</div>
              <div className="ad-detail-price-sub">Цена обсуждается</div>

              <div className="ad-detail-side-actions">
                {isLoggedIn ? (
                  <>
                    <button
                      className="ad-detail-primary-btn"
                      onClick={startChat}
                      disabled={Number(ad.userId) === Number(user?.id)}
                    >
                      <MessageIcon />
                      <span>
                        {Number(ad.userId) === Number(user?.id)
                          ? 'Это ваше объявление'
                          : 'Написать продавцу'}
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    className="ad-detail-primary-btn"
                    onClick={() => navigate('login')}
                  >
                    Войти для связи с продавцом
                  </button>
                )}

                {ad.phone && (
                  <a className="ad-detail-phone-btn" href={`tel:${ad.phone}`}>
                    <PhoneIcon />
                    <span>{ad.phone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="ad-detail-seller-card">
              <h4>О продавце</h4>
              <button
                type="button"
                className="ad-detail-seller-link"
                onClick={openSellerProfile}
                disabled={!sellerId}
                title={sellerId ? 'Открыть профиль продавца' : 'Профиль продавца недоступен'}
              >
                <div className="ad-detail-avatar">
                  {sellerAvatar ? (
                    <img src={sellerAvatar} alt={sellerName} className="ad-detail-avatar-image" />
                  ) : (
                    sellerName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <strong>{sellerName}</strong>
                  <div className="ad-detail-seller-sub">На платформе с {sellerJoined}</div>
                </div>
              </button>

              <div className="ad-detail-seller-meta">
                <div>
                  <span>Объявление активно</span>
                  <strong>{ad.status || 'Опубликовано'}</strong>
                </div>
                <div>
                  <span>Просмотры</span>
                  <strong>{ad.views || 0}</strong>
                </div>
              </div>

              {isLoggedIn && (
                <button className="ad-detail-report-btn" onClick={sendReport}>
                  Пожаловаться на объявление
                </button>
              )}
            </div>

            <div className="ad-detail-safety">
              <div className="ad-detail-safety-title">Безопасная сделка</div>
              <p>Встречайтесь в людном месте и проверяйте товар перед оплатой.</p>
              <div className="ad-detail-safety-item">
                <CheckIcon />
                <span>Не переводите предоплату незнакомым людям</span>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="ad-detail-similar">
            <div className="ad-detail-similar-head">
              <h2>Похожие объявления</h2>
            </div>

            <div className="ad-detail-similar-grid">
              {similar.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ad-detail-similar-card"
                  onClick={() => navigate('ad-detail', { id: item.id })}
                >
                  <div className="ad-detail-similar-image-wrap">
                    {Array.isArray(item.images) && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="ad-detail-similar-image" />
                    ) : (
                      <div className="ad-detail-similar-empty">Нет фото</div>
                    )}
                  </div>

                  <div className="ad-detail-similar-body">
                    <div className="ad-detail-similar-category">{item.category || 'Объявление'}</div>
                    <h3>{item.title}</h3>
                    <div className="ad-detail-similar-price">{formatPrice(item.price)}</div>
                    <div className="ad-detail-similar-city">{item.city || 'Город не указан'}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

    </section>
  );
}

export default AdDetail;
