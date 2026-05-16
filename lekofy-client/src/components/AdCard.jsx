import { useState } from 'react';
import { favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

function AdCard({
  id,
  title,
  price,
  emoji = '📱',
  description = 'Хорошее состояние',
  imageUrl,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      alert('Сначала войдите в аккаунт, чтобы добавлять в избранное');
      return;
    }

    if (!id) {
      return;
    }

    try {
      setLoading(true);
      if (isFavorite) {
        await favoritesAPI.remove(id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(id);
        setIsFavorite(true);
      }
    } catch (err) {
      alert(err.message || 'Не удалось изменить избранное');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          emoji
        )}
        <div className="card-badge">🔥 Популярное</div>
      </div>

      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>

      <div className="card-footer">
        <div className="price">{price} сом</div>
        <button
          className="card-action"
          onClick={toggleFavorite}
          disabled={loading}
          style={{
            background: isFavorite
              ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  );
}

export default AdCard;
