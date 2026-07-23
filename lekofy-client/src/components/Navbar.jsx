import { resolveMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

const NAV_LINKS = [
  { label: 'РљР°С‚РµРіРѕСЂРёРё', target: 'categories' },
  { label: 'РќРѕРІС‹Рµ', target: 'new-ads' },
  { label: 'РџРѕРїСѓР»СЏСЂРЅС‹Рµ', target: 'popular-ads' },
  { label: 'Р”РѕРІРµСЂРёРµ', target: 'trust' },
];

const MOBILE_NAV_ITEMS = [
  { key: 'home', label: 'Р“Р»Р°РІРЅР°СЏ', icon: 'fa-house', target: 'home' },
  { key: 'favorites', label: 'РР·Р±СЂР°РЅРЅРѕРµ', icon: 'fa-heart', target: 'favorites' },
  { key: 'publish', label: 'РџРѕРґР°С‚СЊ', icon: 'fa-plus', target: 'publish', center: true },
  { key: 'chat', label: 'Р§Р°С‚С‹', icon: 'fa-comments', target: 'chat' },
  { key: 'profile', label: 'РџСЂРѕС„РёР»СЊ', icon: 'fa-user', target: 'profile' },
];

function Navbar() {
  const { isLoggedIn, user } = useAuth();
  const { navigate, page } = useRouter();
  const actionLabel = 'РџРѕРґР°С‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ';
  const isHome = page === 'home';

  const scrollToSection = (target) => {
    const go = () => {
      const element = document.getElementById(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (page !== 'home') {
      navigate('home');
      window.setTimeout(go, 60);
      return;
    }

    go();
  };

  const openMobileTarget = (target) => {
    if (target === 'home') {
      navigate('home');
      return;
    }

    if (!isLoggedIn) {
      navigate('login');
      return;
    }

    if (target === 'profile') {
      navigate('profile', { userId: user?.id });
      return;
    }

    navigate(target);
  };

  const isMobileActive = (target) => {
    if (target === 'profile') return page === 'profile';
    return page === target;
  };

  if (isHome) {
    return (
      <>
        <header className="home-topbar">
          <div className="home-topbar__inner">
            <button type="button" className="home-brand" onClick={() => navigate('home')} aria-label="Lekofy">
              <img src="/lekofy-logo.svg" alt="Lekofy" />
            </button>

            <button type="button" className="home-location">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <span>Бишкек</span>
              <i className="fa-solid fa-chevron-down" aria-hidden="true" />
            </button>

            <div className="home-actions">
              <button
                type="button"
                className="home-action-link"
                onClick={() => (isLoggedIn ? navigate('favorites') : navigate('login'))}
              >
                Избранное
              </button>
              <button
                type="button"
                className="home-action-link"
                onClick={() => (isLoggedIn ? navigate('chat') : navigate('login'))}
              >
                Сообщения <span className="home-action-link__badge">3</span>
              </button>
              <button
                type="button"
                className="home-icon-btn"
                onClick={() => (isLoggedIn ? navigate('notifications') : navigate('login'))}
                aria-label="Уведомления"
              >
                <i className="fa-regular fa-bell" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="home-avatar"
                onClick={() => (isLoggedIn ? navigate('profile', { userId: user?.id }) : navigate('login'))}
                aria-label={isLoggedIn ? 'Профиль' : 'Войти'}
                title={isLoggedIn ? user?.name || 'Профиль' : 'Войти'}
              >
                {user?.avatarUrl || user?.avatar ? (
                  <img src={resolveMediaUrl(user.avatarUrl || user.avatar)} alt={user?.name || 'Профиль'} />
                ) : (
                  <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </button>
              <button
                type="button"
                className="home-primary"
                onClick={() => (isLoggedIn ? navigate('publish') : navigate('login'))}
              >
                <i className="fa-solid fa-plus" aria-hidden="true" />
                {actionLabel}
              </button>
            </div>
          </div>
        </header>

        <nav className="mobile-bottom-nav" aria-label="Мобильная навигация">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = isMobileActive(item.target);

            return (
              <button
                key={item.key}
                type="button"
                className={`mobile-bottom-nav__item ${item.center ? 'mobile-bottom-nav__item--center' : ''} ${active ? 'is-active' : ''}`}
                onClick={() => openMobileTarget(item.target)}
                aria-label={item.label}
              >
                <span className="mobile-bottom-nav__icon">
                  <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                </span>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  return (
    <>
      <header className="lekofy-header">
        <div className="lekofy-header__inner">
          <button type="button" className="lekofy-brand" onClick={() => navigate('home')} aria-label="Lekofy">
            <img src="/lekofy-logo.svg" alt="Lekofy" className="lekofy-brand__logo" />
          </button>

          <nav className="lekofy-nav" aria-label="Главная навигация">
            {NAV_LINKS.map((link) => (
              <button key={link.target} type="button" className="lekofy-nav__link" onClick={() => scrollToSection(link.target)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="lekofy-header__actions">
            <button
              type="button"
              className="lekofy-header__button lekofy-header__button--ghost"
              onClick={() => (isLoggedIn ? navigate('profile', { userId: user?.id }) : navigate('login'))}
            >
              {isLoggedIn ? user?.name || 'Профиль' : 'Войти'}
            </button>
            <button
              type="button"
              className="lekofy-header__button lekofy-header__button--primary"
              onClick={() => (isLoggedIn ? navigate('publish') : navigate('login'))}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              {actionLabel}
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Мобильная навигация">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isMobileActive(item.target);

          return (
            <button
              key={item.key}
              type="button"
              className={`mobile-bottom-nav__item ${item.center ? 'mobile-bottom-nav__item--center' : ''} ${active ? 'is-active' : ''}`}
              onClick={() => openMobileTarget(item.target)}
              aria-label={item.label}
            >
              <span className="mobile-bottom-nav__icon">
                <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              </span>
              <span className="mobile-bottom-nav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default Navbar;
