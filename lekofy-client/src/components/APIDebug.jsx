import { useState, useEffect } from 'react';

export function APIDebug() {
  const [status, setStatus] = useState('Checking API...');
  const [color, setColor] = useState('#f39c12');

  useEffect(() => {
    const checkAPI = async () => {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
      const pingUrl = apiBase.endsWith('/api')
        ? `${apiBase.slice(0, -4)}/ping`
        : `${apiBase}/ping`;

      try {
        const response = await fetch(pingUrl);
        await response.json();
        setStatus('API is up');
        setColor('#27ae60');
      } catch (err) {
        setStatus(`API unavailable: ${err.message}`);
        setColor('#e74c3c');
      }
    };

    checkAPI();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color,
        fontWeight: '600',
        zIndex: 999,
      }}
    >
      {status}
    </div>
  );
}
