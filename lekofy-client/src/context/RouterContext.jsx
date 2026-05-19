import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

function parseHashRoute(hash) {
  const cleanHash = String(hash || '').replace(/^#/, '').replace(/\/?$/, '');

  if (!cleanHash || cleanHash === '/') {
    return { page: 'home', params: {} };
  }

  const adMatch = cleanHash.match(/^\/ad\/([^/]+)$/);
  if (adMatch) {
    return { page: 'ad-detail', params: { id: decodeURIComponent(adMatch[1]) } };
  }

  const chatMatch = cleanHash.match(/^\/chat\/([^/]+)$/);
  if (chatMatch) {
    return { page: 'chat-window', params: { chatId: decodeURIComponent(chatMatch[1]) } };
  }

  const profileMatch = cleanHash.match(/^\/profile\/([^/]+)$/);
  if (profileMatch) {
    return { page: 'profile', params: { userId: decodeURIComponent(profileMatch[1]) } };
  }

  if (cleanHash === '/chat') return { page: 'chat', params: {} };
  if (cleanHash === '/my-ads') return { page: 'my-ads', params: {} };
  if (cleanHash === '/favorites') return { page: 'favorites', params: {} };
  if (cleanHash === '/notifications') return { page: 'notifications', params: {} };
  if (cleanHash === '/login') return { page: 'login', params: {} };
  if (cleanHash === '/register') return { page: 'register', params: {} };
  if (cleanHash === '/publish') return { page: 'publish', params: {} };
  if (cleanHash === '/admin') return { page: 'admin', params: {} };
  if (cleanHash === '/settings') return { page: 'settings', params: {} };

  return { page: 'home', params: {} };
}

function buildHash(page, params = {}) {
  if (page === 'ad-detail' && params.id) {
    return `#/ad/${encodeURIComponent(params.id)}`;
  }
  if (page === 'chat-window' && params.chatId) {
    return `#/chat/${encodeURIComponent(params.chatId)}`;
  }
  if (page === 'profile' && params.userId) {
    return `#/profile/${encodeURIComponent(params.userId)}`;
  }
  if (page === 'chat') return '#/chat';
  if (page === 'my-ads') return '#/my-ads';
  if (page === 'favorites') return '#/favorites';
  if (page === 'notifications') return '#/notifications';
  if (page === 'login') return '#/login';
  if (page === 'register') return '#/register';
  if (page === 'publish') return '#/publish';
  if (page === 'admin') return '#/admin';
  if (page === 'settings') return '#/settings';
  return '#/';
}

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => parseHashRoute(window.location.hash));

  const navigate = useCallback((page, params = {}) => {
    const nextRoute = { page, params };
    setRoute(nextRoute);

    const nextHash = buildHash(page, params);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const value = useMemo(
    () => ({
      page: route.page,
      params: route.params,
      navigate,
    }),
    [route, navigate],
  );

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter должен использоваться внутри RouterProvider');
  }
  return ctx;
}
