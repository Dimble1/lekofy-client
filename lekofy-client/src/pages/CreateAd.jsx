import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import { adsAPI, uploadFilesToSupabase } from '../services/api';

function CreateAd() {
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    navigate('login');
    return null;
  }

  const handleFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    // РџРѕР·РІРѕР»СЏРµС‚ РїРѕРІС‚РѕСЂРЅРѕ РІС‹Р±СЂР°С‚СЊ С‚Рµ Р¶Рµ С„Р°Р№Р»С‹.
    e.target.value = '';

    setFiles((prev) => {
      const existing = new Set(
        prev.map((f) => `${f.name}_${f.size}_${f.lastModified}`)
      );
      const next = [...prev];

      picked.forEach((file) => {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        if (!existing.has(key)) {
          next.push(file);
          existing.add(key);
        }
      });

      return next.slice(0, 5);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      setError('Р—Р°РїРѕР»РЅРёС‚Рµ РЅР°Р·РІР°РЅРёРµ Рё С†РµРЅСѓ');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const imageUrls = await uploadFilesToSupabase(files, { folder: 'ads' });
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('phone', phone);
      formData.append('category', category);
      formData.append('city', city);
      imageUrls.forEach((url) => formData.append('images', url));

      const data = await adsAPI.create(formData);
      alert('Объявление опубликовано!');
      navigate('my-ads', data?.id ? { editId: data.id } : {});
    } catch (err) {
      setError(err.message || 'Ошибка публикации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <div className="create-form">
        <button
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
          onClick={() => navigate('home')}
        >
          в†ђ РќР°Р·Р°Рґ
        </button>
        <h2>РџРѕРґР°С‚СЊ РѕР±СЉСЏРІР»РµРЅРёРµ</h2>
        <div
          style={{
            background: '#fff3e0',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#e65100',
          }}
        >
          вЏі РћР±СЉСЏРІР»РµРЅРёРµ РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РїСЂРѕРІРµСЂРєРё РјРѕРґРµСЂР°С‚РѕСЂРѕРј
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            РќР°Р·РІР°РЅРёРµ *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="РќР°РїСЂРёРјРµСЂ: iPhone 14 Pro"
            />
          </label>
          <label>
            РћРїРёСЃР°РЅРёРµ
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="РћРїРёС€РёС‚Рµ С‚РѕРІР°СЂ РїРѕРґСЂРѕР±РЅРµРµ..."
            />
          </label>
          <label>
            Р¦РµРЅР° (СЃРѕРј) *
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </label>
          <label>
            РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+996 700 000 000"
            />
          </label>
          <label>
            РљР°С‚РµРіРѕСЂРёСЏ
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Р’С‹Р±РµСЂРёС‚Рµ РєР°С‚РµРіРѕСЂРёСЋ</option>
              <option value="electronics">Р­Р»РµРєС‚СЂРѕРЅРёРєР°</option>
              <option value="transport">РўСЂР°РЅСЃРїРѕСЂС‚</option>
              <option value="realty">РќРµРґРІРёР¶РёРјРѕСЃС‚СЊ</option>
              <option value="clothes">РћРґРµР¶РґР°</option>
              <option value="furniture">РњРµР±РµР»СЊ</option>
              <option value="jobs">Р Р°Р±РѕС‚Р°</option>
              <option value="services">РЈСЃР»СѓРіРё</option>
              <option value="other">Р”СЂСѓРіРѕРµ</option>
            </select>
          </label>
          <label>
            Р“РѕСЂРѕРґ
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Р‘РёС€РєРµРє"
            />
          </label>

          <label>
            Р¤РѕС‚Рѕ (РґРѕ 5 С€С‚СѓРє)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
            />
          </label>
          {files.length > 0 && (
            <div className="preview-images" style={{ marginTop: 8 }}>
              {files.map((file) => (
                <span
                  key={file.name}
                  style={{ fontSize: 12, marginRight: 8, color: '#555' }}
                >
                  {file.name}
                </span>
              ))}
            </div>
          )}

          {error && (
            <p style={{ color: 'red', marginTop: 8, fontSize: 13 }}>{error}</p>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'РћС‚РїСЂР°РІРєР°...' : 'РћС‚РїСЂР°РІРёС‚СЊ РЅР° РјРѕРґРµСЂР°С†РёСЋ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAd;

