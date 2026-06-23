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

  return (
    <header className="lekofy-header">
      <div className="lekofy-header__inner">
        <button type="button" className="lekofy-brand" onClick={() => navigate('home')} aria-label="Lekofy">
          <img src="/lekofy-logo.svg" alt="Lekofy" className="lekofy-brand__logo" />
          <span className="lekofy-brand__name">Lekofy</span>
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
