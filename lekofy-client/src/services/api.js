// Р‘Р°Р·РѕРІС‹Р№ URL РґР»СЏ API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ С‚РѕРєРµРЅР° РёР· localStorage
const getToken = () => localStorage.getItem('token');

// Р¤СѓРЅРєС†РёСЏ РґР»СЏ СѓСЃС‚Р°РЅРѕРІРєРё С‚РѕРєРµРЅР°
const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

// Р¤СѓРЅРєС†РёСЏ РґР»СЏ СѓРґР°Р»РµРЅРёСЏ С‚РѕРєРµРЅР°
const removeToken = () => {
  localStorage.removeItem('token');
};

// Р‘Р°Р·РѕРІР°СЏ С„СѓРЅРєС†РёСЏ РґР»СЏ Р·Р°РїСЂРѕСЃРѕРІ
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = options.body;
  if (body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      body,
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    let data = {};

    if (text) {
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: 'Некорректный JSON в ответе сервера' };
        }
      } else {
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text };
        }
      }
    }

    if (!response.ok) {
      const error = new Error(data.error || `Ошибка сервера (${response.status})`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error?.status !== 404) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// ============ AUTH API ============
export const authAPI = {
  register: (name, email, password, phone, confirmPassword) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone, confirmPassword }),
    }),

  login: (login, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  logout: () => {
    removeToken();
  },

  getProfile: () => request('/auth/profile'),

  updateProfile: (userData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
};

// ============ ADS API ============
export const adsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.city) params.append('city', filters.city);

    return request(`/ads${params ? '?' + params : ''}`);
  },

  getById: (id) => request(`/ads/${id}`),

  getMyAds: () => request('/ads/my/list'),

  getRecommended: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    if (filters.excludeId) params.append('excludeId', filters.excludeId);
    if (filters.limit) params.append('limit', filters.limit);

    return request(`/ads/recommend${params ? '?' + params : ''}`);
  },

  create: (adData) => {
    let body;
    if (adData instanceof FormData) {
      body = adData;
    } else {
      const formData = new FormData();
      Object.keys(adData).forEach(key => {
        if (key === 'images') {
          (adData.images || []).forEach((image) => {
            // backend expects repeated `images` fields (multer upload.array('images', ...))
            formData.append('images', image);
          });
        } else if (adData[key] && typeof adData[key] === 'object' && !(adData[key] instanceof File)) {
          // Translate objects (meta) to JSON strings so backend can parse them.
          formData.append(key, JSON.stringify(adData[key]));
        } else {
          formData.append(key, adData[key]);
        }
      });
      body = formData;
    }
    return request('/ads', {
      method: 'POST',
      body,
    });
  },

  update: (id, adData) => {
    let body;
    if (adData instanceof FormData) {
      body = adData;
    } else {
      body = JSON.stringify(adData);
    }

    return request(`/ads/${id}`, {
      method: 'PUT',
      body,
    });
  },

  delete: (id) =>
    request(`/ads/${id}`, {
      method: 'DELETE',
    }),

  report: (id, reason) =>
    request(`/ads/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  offerPrice: (id, offeredPrice, note = '') =>
    request(`/ads/${id}/offer-price`, {
      method: 'POST',
      body: JSON.stringify({ offeredPrice, note }),
    }),
};

// ============ FAVORITES API ============
export const favoritesAPI = {
  getAll: () => request('/favorites'),

  add: (adId) =>
    request(`/favorites/${adId}`, {
      method: 'POST',
    }),

  remove: (adId) =>
    request(`/favorites/${adId}`, {
      method: 'DELETE',
    }),

  check: (adId) => request(`/favorites/check/${adId}`),
};

// ============ CHAT API ============
export const chatAPI = {
  getAll: () => request('/chat'),

  getById: (chatId) => request(`/chat/${chatId}`),

  create: (sellerId, adId) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ sellerId, adId }),
    }),

  sendMessage: (chatId, messageText) =>
    request(`/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: messageText }),
    }),

  sendImageMessage: (chatId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request(`/chat/${chatId}/messages/image`, {
      method: 'POST',
      body: formData,
    });
  },

  getMessages: (chatId) => request(`/chat/${chatId}/messages`),

  markAsRead: (chatId) =>
    request(`/chat/${chatId}/read`, {
      method: 'POST',
    }),

  setTyping: (chatId, isTyping) =>
    request(`/chat/${chatId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ isTyping }),
    }),

  getTyping: (chatId) => request(`/chat/${chatId}/typing`),
};

// ============ PROFILE API ============
export const profileAPI = {
  getById: (userId) => request(`/auth/profile/${userId}`),

  updateMe: (formData) =>
    request('/auth/me', {
      method: 'PUT',
      body: formData,
    }),
};

export const telegramAPI = {
  getSettings: () => request('/auth/telegram/settings'),

  setEnabled: (enabled) =>
    request('/auth/telegram/settings', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};

// ============ ADMIN API ============
export const adminAPI = {
  getStats: () => request('/admin/stats'),

  getPendingAds: () => request('/admin/ads/pending'),

  moderateAd: (adId, action) =>
    request(`/admin/ads/${adId}/${action}`, {
      method: 'PUT',
    }),

  getUsers: () => request('/admin/users'),

  toggleUserBlock: (userId, isBlocked) =>
    request(`/admin/users/${userId}/${isBlocked ? 'unblock' : 'block'}`, {
      method: 'PUT',
    }),

  getAllAds: () => request('/ads'),

  deleteAd: (adId) =>
    request(`/ads/${adId}`, {
      method: 'DELETE',
    }),

  getReports: () => request('/admin/reports'),

  updateReportStatus: (reportId, status) =>
    request(`/admin/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// ============ NOTIFICATIONS API ============
export const notificationsAPI = {
  getMine: () => request('/notifications/mine'),

  markAsRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllAsRead: () =>
    request('/notifications/read-all', {
      method: 'POST',
    }),
};

// ============ Authentication helpers ============
export const isLoggedIn = () => !!getToken();

export const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUserToStorage = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = () => {
  removeToken();
  localStorage.removeItem('user');
};

// Р”Р»СЏ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ РІ AuthContext
export { getToken, setToken };

