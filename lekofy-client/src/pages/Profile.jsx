import { useEffect, useMemo, useRef, useState } from 'react';
import { chatAPI, profileAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/Profile.css';

function Profile({ userId }) {
  const { navigate } = useRouter();
  const { user: currentUser, setAuthUser, isLoggedIn } = useAuth();

  const avatarInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isBioEditing, setIsBioEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');

  const [nameSaving, setNameSaving] = useState(false);
  const [bioSaving, setBioSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [nameError, setNameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  const normalizeUser = (user) => {
    if (!user || typeof user !== 'object') return user;
    return {
      ...user,
      avatarUrl: user.avatarUrl || user.avatar || '',
    };
  };

  useEffect(() => {
    document.body.classList.add('profile-theme-active');
    const root = document.getElementById('root');
    root?.classList.add('profile-root-active');

    return () => {
      document.body.classList.remove('profile-theme-active');
      root?.classList.remove('profile-root-active');
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await profileAPI.getById(userId);
        if (data.error) throw new Error(data.error);

        setProfile(normalizeUser(data.user));
        setAds(Array.isArray(data.ads) ? data.ads : []);
      } catch (e) {
        setError(e.message || 'Ошибка загрузки профиля');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const isSelf = currentUser && profile && currentUser.id === profile.id;

  useEffect(() => {
    if (!profile) return;
    setNameDraft(profile.name || '');
    setBioDraft(profile.bio || '');
  }, [profile]);

  const joinDate = useMemo(() => {
    if (!profile?.createdAt) return 'дата неизвестна';

    const parsedDate = new Date(profile.createdAt);
    if (Number.isNaN(parsedDate.getTime())) return 'дата неизвестна';

    return parsedDate.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
    });
  }, [profile?.createdAt]);

  const soldCount = Number(profile?.soldCount || profile?.completedDeals || 0);

  const applyUpdatedUser = (updated) => {
    const normalizedUpdated = normalizeUser(updated);
    const mergedProfile = {
      ...profile,
      ...(normalizedUpdated && typeof normalizedUpdated === 'object' ? normalizedUpdated : {}),
    };

    setProfile(mergedProfile);

    if (setAuthUser) {
      setAuthUser({
        ...(currentUser || {}),
        ...(normalizedUpdated && typeof normalizedUpdated === 'object' ? normalizedUpdated : {}),
      });
    }
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError('Имя не может быть пустым.');
      return;
    }

    try {
      setNameSaving(true);
      setNameError('');

      const formData = new FormData();
      formData.append('name', trimmed);
      const response = await profileAPI.updateMe(formData);
      const updatedUser = response?.user || response;
      applyUpdatedUser({ ...updatedUser, name: trimmed });
      setIsNameEditing(false);
    } catch (e) {
      setNameError(e.message || 'Не удалось обновить имя');
    } finally {
      setNameSaving(false);
    }
  };

  const saveBio = async () => {
    try {
      setBioSaving(true);
      setBioError('');

      const trimmedBio = bioDraft.trim();
      const formData = new FormData();
      formData.append('bio', trimmedBio);
      const response = await profileAPI.updateMe(formData);
      const updatedUser = response?.user || response;
      applyUpdatedUser({ ...updatedUser, bio: trimmedBio });
      setIsBioEditing(false);
    } catch (e) {
      setBioError(e.message || 'Не удалось обновить описание');
    } finally {
      setBioSaving(false);
    }
  };

  const onPickAvatar = () => {
    if (avatarSaving) return;
    avatarInputRef.current?.click();
  };

  const onAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setAvatarSaving(true);
      setAvatarError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await profileAPI.updateMe(formData);
      const updatedUser = response?.user || response;

      if (!updatedUser || typeof updatedUser !== 'object') {
        throw new Error('Сервер не вернул обновленный профиль');
      }

      applyUpdatedUser(updatedUser);
    } catch (e) {
      setAvatarError(e.message || 'Не удалось обновить аватар');
    } finally {
      setAvatarSaving(false);
    }
  };

  const buildProfileShareUrl = () => {
    const safeId = encodeURIComponent(profile?.id || userId || '');
    return `${window.location.origin}${window.location.pathname}#/profile/${safeId}`;
  };

  const fallbackCopyToClipboard = async (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const handleShareProfile = async () => {
    try {
      setShareStatus('');
      const url = buildProfileShareUrl();
      const title = `Профиль ${profile?.name || 'пользователя'} на Lekofy`;
      const text = `Посмотри профиль ${profile?.name || 'пользователя'} на Lekofy`;

      if (navigator.share) {
        await navigator.share({ title, text, url });
        setShareStatus('Ссылка отправлена');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        await fallbackCopyToClipboard(url);
      }

      setShareStatus('Ссылка скопирована');
    } catch {
      setShareStatus('Не удалось поделиться ссылкой');
    }
  };


  const handleContactClick = async () => {
    if (!profile?.id) return;
    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    try {
      setContactLoading(true);
      setContactError('');

      const chat = await chatAPI.create(profile.id, null);
      const chatId = chat?.id;
      if (!chatId) throw new Error('Не удалось открыть чат');

      navigate('chat-window', {
        chatId,
        profileUserId: profile.id,
        profileName: profile.name,
        title: `Чат с ${profile.name || 'пользователем'}`,
      });
    } catch (e) {
      setContactError(e.message || 'Не удалось открыть чат');
    } finally {
      setContactLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="container">
        <p>Некорректный профиль.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container">
        <p style={{ color: 'red' }}>{error || 'Профиль не найден'}</p>
      </div>
    );
  }

  return (
    <div className="container profile-page">
      <button className="btn btn-secondary profile-back" onClick={() => navigate('home')}>
        ← Назад
      </button>

      <div className="profile-grid">
        <div className="profile-main">
          <section className="profile-hero-card">
            <div className="profile-avatar-wrap" aria-hidden="true">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name || 'Пользователь'} className="profile-avatar" />
              ) : (
                <span className="profile-avatar-initial">{profile.name?.charAt(0)?.toUpperCase() || '?'}</span>
              )}
              {isSelf && (
                <button className="profile-avatar-edit" onClick={onPickAvatar} title="Сменить аватар" disabled={avatarSaving}>
                  {avatarSaving ? '…' : '✎'}
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="profile-hidden-input"
                onChange={onAvatarFileChange}
              />
            </div>

            <div className="profile-hero-info">
              <div className="profile-title-row">
                {isSelf && isNameEditing ? (
                  <div className="profile-inline-edit">
                    <input
                      className="profile-inline-input"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      maxLength={60}
                    />
                    <button className="profile-mini-btn" onClick={saveName} disabled={nameSaving}>
                      {nameSaving ? '...' : 'Сохранить'}
                    </button>
                    <button
                      className="profile-mini-btn ghost"
                      onClick={() => {
                        setNameDraft(profile.name || '');
                        setNameError('');
                        setIsNameEditing(false);
                      }}
                      disabled={nameSaving}
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <>
                    <h1>{profile.name || 'Пользователь Lekofy'}</h1>
                    {isSelf && (
                      <button className="profile-name-edit" onClick={() => setIsNameEditing(true)} title="Редактировать имя">
                        ✎
                      </button>
                    )}
                  </>
                )}
                {isSelf && <span className="profile-badge">PRO</span>}
                {profile?.telegramConfirmed && (
                  <span className="profile-badge">Telegram подтвержден</span>
                )}
              </div>
              {nameError && <div className="profile-inline-error">{nameError}</div>}
              {avatarError && <div className="profile-inline-error">{avatarError}</div>}

              <div className="profile-meta-row">
                <span>На Lekofy с {joinDate}</span>
                <span className="profile-meta-separator">•</span>
                <span>Отвечает быстро</span>
              </div>

              <div className="profile-action-row">
                {!isSelf && (
                  <button
                    className="profile-primary-btn"
                    onClick={handleContactClick}
                    disabled={contactLoading}
                  >
                    {contactLoading ? 'Открываю чат...' : 'Написать'}
                  </button>
                )}
              </div>
              {contactError && <div className="profile-inline-error">{contactError}</div>}
            </div>
          </section>

          <section className="profile-stats-row">
            <div className="profile-stat-card">
              <span className="profile-stat-value">{ads.length}</span>
              <span className="profile-stat-label">Активных объявлений</span>
            </div>
            <div className="profile-stat-card">
              <span className="profile-stat-value">{soldCount}</span>
              <span className="profile-stat-label">Продано всего</span>
            </div>
          </section>

          <section className="profile-about-card">
            <div className="profile-about-head">
              <h2>О себе</h2>
              {isSelf && !isBioEditing && (
                <button className="profile-about-edit" onClick={() => setIsBioEditing(true)}>
                  ✎ Редактировать
                </button>
              )}
            </div>

            {isSelf && isBioEditing ? (
              <div className="profile-bio-edit-wrap">
                <textarea
                  className="profile-edit-textarea"
                  value={bioDraft}
                  onChange={(event) => setBioDraft(event.target.value)}
                  maxLength={800}
                  rows={5}
                />
                {bioError && <div className="profile-inline-error">{bioError}</div>}
                <div className="profile-edit-actions">
                  <button className="profile-primary-btn" onClick={saveBio} disabled={bioSaving}>
                    {bioSaving ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                  <button
                    className="profile-ghost-btn"
                    onClick={() => {
                      setBioDraft(profile.bio || '');
                      setBioError('');
                      setIsBioEditing(false);
                    }}
                    disabled={bioSaving}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p>
                {profile.bio ||
                  'Пользователь пока не добавил описание. Здесь можно рассказать о себе, формате сделок и удобном способе связи.'}
              </p>
            )}
          </section>

          <section className="profile-ads-section">
            <div className="profile-ads-header">
              <h2>Активные объявления ({ads.length})</h2>
            </div>

            {ads.length === 0 ? (
              <div className="profile-empty">У пользователя пока нет активных объявлений.</div>
            ) : (
              <div className="profile-ads-grid">
                {ads.map((ad) => (
                  <article
                    key={ad.id}
                    className="profile-ad-card"
                    onClick={() => navigate('ad-detail', { id: ad.id })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate('ad-detail', { id: ad.id });
                      }
                    }}
                  >
                    <div className="profile-ad-image-wrap">
                      {Array.isArray(ad.images) && ad.images.length > 0 ? (
                        <img src={ad.images[0]} alt={ad.title} className="profile-ad-image" />
                      ) : (
                        <div className="profile-ad-image-placeholder">Нет фото</div>
                      )}
                    </div>

                    <div className="profile-ad-content">
                      <h3>{ad.title}</h3>
                      <div className="profile-ad-price">{Number(ad.price || 0).toLocaleString('ru-RU')} сом</div>
                      <div className="profile-ad-city">{ad.city || 'Город не указан'}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="profile-sidebar">
          <section className="profile-side-card">
            <h3>Советы по безопасности</h3>
            <ul>
              <li>Общайтесь и договаривайтесь внутри Lekofy.</li>
              <li>Проверяйте товар до оплаты при личной встрече.</li>
              <li>Для удаленных сделок используйте безопасные варианты доставки.</li>
            </ul>
          </section>

          <section className="profile-side-card">
            <h3>Действия</h3>
            <button className="profile-side-action" onClick={handleShareProfile}>
              Поделиться профилем
            </button>
            {shareStatus && <div className="profile-share-status">{shareStatus}</div>}
            {isSelf && (
              <button className="profile-side-action" onClick={() => navigate('settings')}>
                Настройки
              </button>
            )}
            {!isSelf && <button className="profile-side-action danger">Пожаловаться на пользователя</button>}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default Profile;
