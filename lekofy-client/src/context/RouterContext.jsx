import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

function parseHashRoute(hash) {
  const cleanHash = String(hash || '').replace(/^#/, '').replace(/\/?$/, '');
  const [pathPart, queryString = ''] = cleanHash.split('?');
  const params = new URLSearchParams(queryString);

  if (!pathPart || pathPart === '/') {
    return { page: 'home', params: {} };
  }

  const adMatch = pathPart.match(/^\/ad\/([^/]+)$/);
  if (adMatch) {
    return { page: 'ad-detail', params: { id: decodeURIComponent(adMatch[1]) } };
  }

  const chatMatch = pathPart.match(/^\/chat\/([^/]+)$/);
  if (chatMatch) {
    return { page: 'chat-window', params: { chatId: decodeURIComponent(chatMatch[1]) } };
  }

  const profileMatch = pathPart.match(/^\/profile\/([^/]+)$/);
  if (profileMatch) {
    return { page: 'profile', params: { userId: decodeURIComponent(profileMatch[1]) } };
  }

  if (pathPart === '/chat') return { page: 'chat', params: {} };
  if (pathPart === '/my-ads') return { page: 'my-ads', params: params.get('editId') ? { editId: params.get('editId') } : {} };
  if (pathPart === '/favorites') return { page: 'favorites', params: {} };
  if (pathPart === '/notifications') return { page: 'notifications', params: {} };
  if (pathPart === '/login') return { page: 'login', params: {} };
  if (pathPart === '/register') return { page: 'register', params: {} };
  if (pathPart === '/publish') return { page: 'publish', params: {} };
  if (pathPart === '/admin') return { page: 'admin', params: {} };
  if (pathPart === '/settings') return { page: 'settings', params: {} };

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
  if (page === 'my-ads') {
    return params.editId ? `#/my-ads?editId=${encodeURIComponent(params.editId)}` : '#/my-ads';
  }
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
