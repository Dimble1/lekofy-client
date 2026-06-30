import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';

const NAV_LINKS = [
  { label: 'Категории', target: 'categories' },
  { label: 'Новые', target: 'new-ads' },
  { label: 'Популярные', target: 'popular-ads' },
  { label: 'Доверие', target: 'trust' },
];

function Navbar() {
  const { isLoggedIn, user } = useAuth();
  const { navigate, page } = useRouter();
  const actionLabel = 'Подать объявление';
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

  if (isHome) {
    return (
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
                <img src={user.avatarUrl || user.avatar} alt={user?.name || 'Профиль'} />
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
    );
  }

  return (
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
  );
}

export default Navbar;
