import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useRouter } from '../context/RouterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function Admin() {
  const { user, isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [section, setSection] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      navigate('home');
      return;
    }
    loadSection(section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, isLoggedIn, isAdmin]);

  const loadSection = async (sec) => {
    try {
      setLoading(true);
      setError('');
      if (sec === 'stats') {
        setData(await adminAPI.getStats());
      } else if (sec === 'moderation') {
        setData(await adminAPI.getPendingAds());
      } else if (sec === 'users') {
        setData(await adminAPI.getUsers());
      } else if (sec === 'ads') {
        setData(await adminAPI.getAllAds());
      } else if (sec === 'reports') {
        setData(await adminAPI.getReports());
      }
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn || !isAdmin) return null;

  const renderMain = () => {
    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="empty">{error}</div>;

    if (section === 'stats' && data) {
      return (
        <>
          <h2 style={{ marginBottom: 24 }}>Статистика</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{data.totalUsers}</div>
              <div className="stat-label">Пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{data.totalAds}</div>
              <div className="stat-label">Объявлений</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{data.activeAds}</div>
              <div className="stat-label">Активных</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{data.pendingAds || 0}</div>
              <div className="stat-label">На модерации</div>
            </div>
          </div>
        </>
      );
    }

    if (section === 'moderation') {
      if (!data || !data.length) {
        return (
          <>
            <h2 style={{ marginBottom: 24 }}>Модерация</h2>
            <div className="empty">Нет объявлений на модерации</div>
          </>
        );
      }
      return (
        <>
          <h2 style={{ marginBottom: 24 }}>
            На модерации ({data.length})
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Цена</th>
                <th>Категория</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ad) => (
                <tr key={ad.id}>
                  <td>{ad.id}</td>
                  <td>{ad.title}</td>
                  <td>{Number(ad.price).toLocaleString()} сом</td>
                  <td>{ad.category || '-'}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginRight: 6 }}
                      onClick={async () => {
                        await adminAPI.moderateAd(ad.id, 'approve');
                        loadSection('moderation');
                      }}
                    >
                      Одобрить
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        await adminAPI.moderateAd(ad.id, 'reject');
                        loadSection('moderation');
                      }}
                    >
                      Отклонить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }

    if (section === 'users') {
      if (!data || !data.length) {
        return (
          <>
            <h2 style={{ marginBottom: 24 }}>Пользователи</h2>
            <div className="empty">Пользователей нет</div>
          </>
        );
      }
      return (
        <>
          <h2 style={{ marginBottom: 24 }}>Пользователи</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.isBlocked ? 'Заблокирован' : 'Активен'}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        await adminAPI.toggleUserBlock(u.id, u.isBlocked);
                        loadSection('users');
                      }}
                    >
                      {u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }

    if (section === 'ads') {
      if (!data || !data.length) {
        return (
          <>
            <h2 style={{ marginBottom: 24 }}>Объявления</h2>
            <div className="empty">Объявлений нет</div>
          </>
        );
      }
      return (
        <>
          <h2 style={{ marginBottom: 24 }}>Объявления</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Цена</th>
                <th>Категория</th>
                <th>Просмотры</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ad) => (
                <tr key={ad.id}>
                  <td>{ad.id}</td>
                  <td>{ad.title}</td>
                  <td>{Number(ad.price).toLocaleString()} сом</td>
                  <td>{ad.category || '-'}</td>
                  <td>{ad.views}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        if (!window.confirm('Удалить объявление?')) return;
                        await adminAPI.deleteAd(ad.id);
                        loadSection('ads');
                      }}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }

    if (section === 'reports') {
      if (!data || !data.length) {
        return (
          <>
            <h2 style={{ marginBottom: 24 }}>Жалобы</h2>
            <div className="empty">Жалоб нет ✅</div>
          </>
        );
      }
      return (
        <>
          <h2 style={{ marginBottom: 24 }}>
            Жалобы ({data.length})
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>От кого</th>
                <th>Объявление</th>
                <th>Причина</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.Reporter ? r.Reporter.name : r.reporterId}</td>
                  <td>
                    {r.Ad ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          navigate('ad-detail', { id: r.Ad.id })
                        }
                      >
                        #{r.Ad.id} {r.Ad.title}
                      </button>
                    ) : (
                      `#${r.adId || '—'}`
                    )}
                  </td>
                  <td>{r.reason}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.status === 'pending' ? (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginRight: 4, marginBottom: 4 }}
                          onClick={async () => {
                            await adminAPI.updateReportStatus(
                              r.id,
                              'resolved',
                            );
                            loadSection('reports');
                          }}
                        >
                          Решить
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            await adminAPI.updateReportStatus(
                              r.id,
                              'rejected',
                            );
                            loadSection('reports');
                          }}
                        >
                          Отклонить
                        </button>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    }

    return null;
  };

  return (
    <div className="container">
      <div className="admin-layout">
        <div className="admin-sidebar">
          <h3>Меню</h3>
          <div
            className={`admin-menu-item ${
              section === 'stats' ? 'active' : ''
            }`}
            onClick={() => setSection('stats')}
          >
            📊 Статистика
          </div>
          <div
            className={`admin-menu-item ${
              section === 'moderation' ? 'active' : ''
            }`}
            onClick={() => setSection('moderation')}
          >
            ⏳ Модерация
          </div>
          <div
            className={`admin-menu-item ${
              section === 'users' ? 'active' : ''
            }`}
            onClick={() => setSection('users')}
          >
            👥 Пользователи
          </div>
          <div
            className={`admin-menu-item ${
              section === 'ads' ? 'active' : ''
            }`}
            onClick={() => setSection('ads')}
          >
            📃 Объявления
          </div>
          <div
            className={`admin-menu-item ${
              section === 'reports' ? 'active' : ''
            }`}
            onClick={() => setSection('reports')}
          >
            🚨 Жалобы
          </div>
        </div>
        <div className="admin-main">{renderMain()}</div>
      </div>
    </div>
  );
}

export default Admin;

