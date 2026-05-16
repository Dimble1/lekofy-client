import React, { useState } from 'react';
import '../styles/AddCarForm.css';
import { adsAPI } from '../services/api';

const AddCarForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    title: '',
    year: new Date().getFullYear(),
    engine_volume: '',
    fuel_type: '',
    transmission: '',
    drive_type: '',
    mileage: '',
    color: '',
    steering_wheel: '',
    country: '',
    payment_type: '',
    price: '',
    description: '',
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);

  const models = {
    Acura: ['ILX', 'Integra', 'MDX', 'RDX', 'TLX', 'ZDX'],
    'Alfa Romeo': ['159', '4C', 'Brera', 'Giulia', 'Giulietta', 'Stelvio', 'Tonale'],
    'Aston Martin': ['DB11', 'DB12', 'DBS', 'DBX', 'Rapide', 'Vantage'],
    Audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
    Bentley: ['Bentayga', 'Continental', 'Flying Spur', 'Mulsanne'],
    BMW: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i4', 'i7', 'i8', 'iX', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4'],
    BYD: ['Atto 3', 'Dolphin', 'Han', 'Qin', 'Seal', 'Song', 'Tang', 'Yuan'],
    Cadillac: ['ATS', 'CT4', 'CT5', 'CTS', 'Escalade', 'SRX', 'XT4', 'XT5', 'XT6'],
    Changan: ['Alsvin', 'CS35', 'CS55', 'CS75', 'Eado', 'UNI-K', 'UNI-T', 'UNI-V'],
    Chery: ['Arrizo 5', 'Arrizo 8', 'Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8'],
    Chevrolet: ['Aveo', 'Camaro', 'Captiva', 'Cobalt', 'Cruze', 'Equinox', 'Impala', 'Lacetti', 'Malibu', 'Niva', 'Spark', 'Tahoe', 'Tracker', 'Trailblazer'],
    Chrysler: ['200', '300', 'Pacifica', 'PT Cruiser', 'Sebring', 'Town & Country'],
    Citroen: ['Berlingo', 'C3', 'C4', 'C5', 'C-Elysee', 'C4 Cactus', 'C5 Aircross', 'Jumpy'],
    Cupra: ['Ateca', 'Born', 'Formentor', 'Leon'],
    Dacia: ['Duster', 'Jogger', 'Logan', 'Lodgy', 'Sandero', 'Spring'],
    Daewoo: ['Gentra', 'Lacetti', 'Lanos', 'Matiz', 'Nexia'],
    Dodge: ['Caliber', 'Challenger', 'Charger', 'Durango', 'Journey', 'Ram'],
    Exeed: ['LX', 'RX', 'TXL', 'VX'],
    Ferrari: ['296', '488', '812', 'F8', 'Portofino', 'Roma', 'SF90'],
    Fiat: ['500', 'Albea', 'Doblo', 'Ducato', 'Linea', 'Panda', 'Punto', 'Tipo'],
    Ford: ['C-Max', 'EcoSport', 'Edge', 'Escape', 'Explorer', 'Fiesta', 'Focus', 'Fusion', 'Kuga', 'Mondeo', 'Mustang', 'Ranger', 'Transit'],
    Geely: ['Atlas', 'Coolray', 'Emgrand', 'Monjaro', 'Okavango', 'Preface', 'Tugella'],
    Genesis: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
    GMC: ['Acadia', 'Sierra', 'Terrain', 'Yukon'],
    'Great Wall': ['Haval H2', 'Haval H5', 'Haval H6', 'Poer', 'Wingle'],
    Haval: ['Dargo', 'F7', 'F7x', 'H5', 'H6', 'Jolion', 'M6'],
    Honda: ['Accord', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Insight', 'Jazz', 'Odyssey', 'Pilot'],
    Hyundai: ['Accent', 'Creta', 'Elantra', 'Getz', 'Grandeur', 'H-1', 'i10', 'i20', 'i30', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Staria', 'Tucson'],
    Infiniti: ['EX35', 'FX35', 'FX37', 'G25', 'G35', 'Q30', 'Q50', 'Q60', 'Q70', 'QX50', 'QX60', 'QX70', 'QX80'],
    Isuzu: ['D-Max', 'MU-X', 'N-Series'],
    Iveco: ['Daily', 'Eurocargo'],
    JAC: ['J7', 'JS4', 'JS6', 'S3', 'S5', 'T6'],
    Jaguar: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'XE', 'XF', 'XJ'],
    Jeep: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Liberty', 'Renegade', 'Wrangler'],
    Jetour: ['Dashing', 'X70', 'X90'],
    Kia: ['Carnival', 'Ceed', 'Cerato', 'K5', 'K7', 'K8', 'Mohave', 'Optima', 'Picanto', 'Rio', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Stinger'],
    Lamborghini: ['Aventador', 'Gallardo', 'Huracan', 'Revuelto', 'Urus'],
    Lancia: ['Delta', 'Thesis', 'Ypsilon'],
    'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
    Lexus: ['ES', 'GS', 'GX', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'UX'],
    'Li Xiang': ['L6', 'L7', 'L8', 'L9'],
    Lincoln: ['Aviator', 'Corsair', 'MKC', 'MKX', 'Navigator'],
    Maserati: ['Ghibli', 'GranTurismo', 'Levante', 'Quattroporte'],
    Mazda: ['2', '3', '5', '6', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-7', 'CX-8', 'CX-9'],
    McLaren: ['540C', '570S', '600LT', '720S', 'GT', 'P1'],
    'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'V-Class', 'Sprinter'],
    Mini: ['Clubman', 'Cooper', 'Countryman', 'Paceman'],
    Mitsubishi: ['ASX', 'Colt', 'Eclipse Cross', 'Galant', 'L200', 'Lancer', 'Montero', 'Outlander', 'Pajero'],
    Nissan: ['Almera', 'Altima', 'Juke', 'Leaf', 'Murano', 'Navara', 'Note', 'Pathfinder', 'Patrol', 'Qashqai', 'Sentra', 'Teana', 'Terrano', 'Tiida', 'X-Trail'],
    Omoda: ['C5', 'E5'],
    Opel: ['Astra', 'Combo', 'Corsa', 'Insignia', 'Meriva', 'Mokka', 'Vectra', 'Vivaro', 'Zafira'],
    Peugeot: ['2008', '3008', '301', '307', '308', '406', '407', '408', '5008', '508', 'Boxer', 'Partner'],
    Polestar: ['2', '3', '4'],
    Porsche: ['718', '911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
    RAM: ['1500', '2500', '3500', 'Promaster'],
    Renault: ['Arkana', 'Captur', 'Clio', 'Duster', 'Fluence', 'Kadjar', 'Kaptur', 'Koleos', 'Laguna', 'Logan', 'Megane', 'Sandero', 'Symbol', 'Talisman', 'Trafic'],
    'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Wraith'],
    SEAT: ['Alhambra', 'Altea', 'Arona', 'Ateca', 'Ibiza', 'Leon', 'Toledo'],
    Skoda: ['Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti'],
    Smart: ['EQ fortwo', 'forfour', 'fortwo'],
    SsangYong: ['Actyon', 'Korando', 'Musso', 'Rexton', 'Tivoli'],
    Subaru: ['BRZ', 'Forester', 'Impreza', 'Legacy', 'Outback', 'Tribeca', 'WRX', 'XV'],
    Suzuki: ['Alto', 'Baleno', 'Grand Vitara', 'Ignis', 'Jimny', 'Liana', 'S-Cross', 'Swift', 'SX4', 'Vitara'],
    Tank: ['300', '500', '700'],
    Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
    Toyota: ['Alphard', 'Auris', 'Avalon', 'Avensis', 'Camry', 'Corolla', 'C-HR', 'Fortuner', 'Highlander', 'Hilux', 'Land Cruiser', 'Land Cruiser Prado', 'Prius', 'RAV4', 'Venza', 'Yaris'],
    Volkswagen: ['Amarok', 'Arteon', 'Caddy', 'Golf', 'ID.4', 'ID.6', 'Jetta', 'Multivan', 'Passat', 'Polo', 'Taos', 'Teramont', 'Tiguan', 'Touareg', 'Transporter'],
    Volvo: ['C30', 'C40', 'S40', 'S60', 'S80', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC70', 'XC90'],
    Voyah: ['Dreamer', 'Free'],
    Zeekr: ['001', '009', 'X']
  };

  const brands = Object.keys(models).sort((a, b) => a.localeCompare(b));

  const fuelTypes = [
    { value: 'petrol', label: 'Бензин' },
    { value: 'diesel', label: 'Дизель' },
    { value: 'hybrid', label: 'Гибрид' },
    { value: 'electric', label: 'Электро' },
  ];

  const transmissions = [
    { value: 'manual', label: 'Механика' },
    { value: 'automatic', label: 'Автомат' },
    { value: 'cvt', label: 'Вариатор' },
  ];

  const driveTypes = [
    { value: 'front', label: 'Передний' },
    { value: 'rear', label: 'Задний' },
    { value: 'awd', label: 'Полный' },
  ];

  const steeringWheels = [
    { value: 'left', label: 'Левый' },
    { value: 'right', label: 'Правый' },
  ];

  const countries = [
    { value: 'kg', label: 'Кыргызстан' },
    { value: 'kz', label: 'Казахстан' },
    { value: 'ru', label: 'Россия' },
    { value: 'am', label: 'Армения' },
  ];

  const paymentTypes = [
    { value: 'cash', label: 'Наличные' },
    { value: 'cashless', label: 'Безналичный' },
    { value: 'exchange', label: 'Обмен' },
    { value: 'installment', label: 'Рассрочка' },
  ];

  const colors = [
    { value: 'black', label: 'Черный', hex: '#000000' },
    { value: 'white', label: 'Белый', hex: '#FFFFFF' },
    { value: 'silver', label: 'Серебристый', hex: '#C0C0C0' },
    { value: 'gray', label: 'Серый', hex: '#808080' },
    { value: 'red', label: 'Красный', hex: '#FF0000' },
    { value: 'blue', label: 'Синий', hex: '#0000FF' },
    { value: 'green', label: 'Зеленый', hex: '#008000' },
    { value: 'yellow', label: 'Желтый', hex: '#FFFF00' },
    { value: 'orange', label: 'Оранжевый', hex: '#FFA500' },
    { value: 'brown', label: 'Коричневый', hex: '#8B4513' },
    { value: 'gold', label: 'Золотой', hex: '#FFD700' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.brand.trim()) newErrors.brand = 'Выберите марку';
    if (!formData.model.trim()) newErrors.model = 'Выберите модель';
    if (!formData.title.trim()) newErrors.title = 'Введите название';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear()) {
      newErrors.year = 'Некорректный год';
    }
    if (!formData.engine_volume || parseFloat(formData.engine_volume) <= 0) {
      newErrors.engine_volume = 'Введите объем двигателя';
    }
    if (!formData.fuel_type) newErrors.fuel_type = 'Выберите тип двигателя';
    if (!formData.transmission) newErrors.transmission = 'Выберите коробку передач';
    if (!formData.drive_type) newErrors.drive_type = 'Выберите привод';
    if (!formData.mileage || parseFloat(formData.mileage) < 0) {
      newErrors.mileage = 'Введите пробег';
    }
    if (!formData.color) newErrors.color = 'Выберите цвет';
    if (!formData.steering_wheel) newErrors.steering_wheel = 'Выберите положение руля';
    if (!formData.country) newErrors.country = 'Выберите страну';
    if (!formData.payment_type) newErrors.payment_type = 'Выберите тип расчета';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Введите цену';
    }
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      newErrors.description = 'Описание должно быть минимум 20 символов';
    }
    if (formData.images.length === 0) {
      newErrors.images = 'Загрузите минимум одно фото';
    } else if (formData.images.length > 10) {
      newErrors.images = 'Максимум 10 фото';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Allows selecting the same files again.
    e.target.value = '';

    const existingKeys = new Set(
      formData.images.map((f) => `${f.name}_${f.size}_${f.lastModified}`)
    );
    const uniqueFiles = files.filter((file) => {
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      return !existingKeys.has(key);
    });

    if (uniqueFiles.length === 0) return;

    if (uniqueFiles.length + formData.images.length > 10) {
      setErrors(prev => ({
        ...prev,
        images: 'Максимум 10 фото',
      }));
      return;
    }

    const newImages = [...formData.images];
    const newPreviews = [...previewImages];

    uniqueFiles.forEach(file => {
      newImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        setPreviewImages([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setFormData(prev => ({
      ...prev,
      images: newImages,
    }));

    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: '',
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'images') {
        formData.images.forEach((image, index) => {
          formDataToSend.append('images', image);
        });
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      await adsAPI.create(formDataToSend);
      alert('Объявление опубликовано!');
      // Можно добавить навигацию
    } catch (error) {
      alert('Ошибка при публикации: ' + error.message);
    }
  };

  const currentModels = models[formData.brand] || [];

  return (
    <div className="add-car-form-container">
      {onBack && (
        <button className="back-button" onClick={onBack} style={{ marginBottom: '16px', background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer' }}>
          &larr; Назад
        </button>
      )}
      <div className="form-header">
        <div className="header-icon">
          <i className="fas fa-car"></i>
        </div>
        <div>
          <h1>Добавить объявление об автомобиле</h1>
          <p>Заполните все поля для создания объявления</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="add-car-form">
        {/* Основная информация */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="fas fa-info-circle"></i> Основная информация
          </h2>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="brand">
                <i className="fas fa-car"></i> Марка автомобиля
              </label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`form-input select ${errors.brand ? 'error' : ''}`}
              >
                <option value="">Выберите марку</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model">
                <i className="fas fa-toolbox"></i> Модель
              </label>
              <select
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                disabled={!formData.brand}
                className={`form-input select ${errors.model ? 'error' : ''}`}
              >
                <option value="">Выберите модель</option>
                {currentModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              {errors.model && <span className="error-message">{errors.model}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              <i className="fas fa-heading"></i> Название объявления
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="例: BMW X5 2019 в отличном состоянии"
              className={`form-input ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>
        </div>

        {/* Технические характеристики */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="fas fa-cog"></i> Технические характеристики
          </h2>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="year">
                <i className="fas fa-calendar"></i> Год выпуска
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className={`form-input ${errors.year ? 'error' : ''}`}
              />
              {errors.year && <span className="error-message">{errors.year}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="engine_volume">
                <i className="fas fa-flask"></i> Объем двигателя (л)
              </label>
              <input
                type="number"
                id="engine_volume"
                name="engine_volume"
                value={formData.engine_volume}
                onChange={handleInputChange}
                placeholder="2.5"
                step="0.1"
                min="0"
                className={`form-input ${errors.engine_volume ? 'error' : ''}`}
              />
              {errors.engine_volume && <span className="error-message">{errors.engine_volume}</span>}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="fuel_type">
                <i className="fas fa-gas-pump"></i> Тип двигателя
              </label>
              <select
                id="fuel_type"
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className={`form-input select ${errors.fuel_type ? 'error' : ''}`}
              >
                <option value="">Выберите тип</option>
                {fuelTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.fuel_type && <span className="error-message">{errors.fuel_type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="transmission">
                <i className="fas fa-sliders-h"></i> Коробка передач
              </label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className={`form-input select ${errors.transmission ? 'error' : ''}`}
              >
                <option value="">Выберите коробку</option>
                {transmissions.map(trans => (
                  <option key={trans.value} value={trans.value}>{trans.label}</option>
                ))}
              </select>
              {errors.transmission && <span className="error-message">{errors.transmission}</span>}
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="drive_type">
                <i className="fas fa-dice-four"></i> Привод
              </label>
              <select
                id="drive_type"
                name="drive_type"
                value={formData.drive_type}
                onChange={handleInputChange}
                className={`form-input select ${errors.drive_type ? 'error' : ''}`}
              >
                <option value="">Выберите привод</option>
                {driveTypes.map(drive => (
                  <option key={drive.value} value={drive.value}>{drive.label}</option>
                ))}
              </select>
              {errors.drive_type && <span className="error-message">{errors.drive_type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mileage">
                <i className="fas fa-tachometer-alt"></i> Пробег (км)
              </label>
              <input
                type="number"
                id="mileage"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                placeholder="50000"
                min="0"
                className={`form-input ${errors.mileage ? 'error' : ''}`}
              />
              {errors.mileage && <span className="error-message">{errors.mileage}</span>}
            </div>
          </div>
        </div>

        {/* Внешний вид и комплектация */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="fas fa-palette"></i> Внешний вид и комплектация
          </h2>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="color">
                <i className="fas fa-droplet"></i> Цвет
              </label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className={`form-input select ${errors.color ? 'error' : ''}`}
              >
                <option value="">Выберите цвет</option>
                {colors.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
              {errors.color && <span className="error-message">{errors.color}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="steering_wheel">
                <i className="fas fa-steering-wheel"></i> Положение руля
              </label>
              <select
                id="steering_wheel"
                name="steering_wheel"
                value={formData.steering_wheel}
                onChange={handleInputChange}
                className={`form-input select ${errors.steering_wheel ? 'error' : ''}`}
              >
                <option value="">Выберите положение</option>
                {steeringWheels.map(wheel => (
                  <option key={wheel.value} value={wheel.value}>{wheel.label}</option>
                ))}
              </select>
              {errors.steering_wheel && <span className="error-message">{errors.steering_wheel}</span>}
            </div>
          </div>
        </div>

        {/* Место учета и условия покупки */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="fas fa-globe"></i> Место учета и условия покупки
          </h2>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="country">
                <i className="fas fa-map-marker-alt"></i> Страна учета
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`form-input select ${errors.country ? 'error' : ''}`}
              >
                <option value="">Выберите страну</option>
                {countries.map(country => (
                  <option key={country.value} value={country.value}>{country.label}</option>
                ))}
              </select>
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="payment_type">
                <i className="fas fa-coins"></i> Тип расчета
              </label>
              <select
                id="payment_type"
                name="payment_type"
                value={formData.payment_type}
                onChange={handleInputChange}
                className={`form-input select ${errors.payment_type ? 'error' : ''}`}
              >
                <option value="">Выберите тип</option>
                {paymentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.payment_type && <span className="error-message">{errors.payment_type}</span>}
            </div>
          </div>
        </div>

        {/* Цена и описание */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="fas fa-tag"></i> Цена и описание
          </h2>

          <div className="form-group">
            <label htmlFor="price">
              <i className="fas fa-money-bill-wave"></i> Цена
            </label>
            <div className="price-input-wrapper">
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="500000"
                min="0"
                className={`form-input ${errors.price ? 'error' : ''}`}
              />
              <span className="currency">сом</span>
            </div>
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <i className="fas fa-file-alt"></i> Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Опишите состояние автомобиля, диагностику и другие важные детали..."
              rows="5"
              className={`form-input textarea ${errors.description ? 'error' : ''}`}
            />
            <span className="char-count">{formData.description.length} / 1000</span>
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
        </div>

        {/* Загрузка фотографий */}
        <div className="form-section">
          <h2 className="section-title">
            <i className="fas fa-images"></i> Фотографии автомобиля
          </h2>

          <div className={`upload-area ${formData.images.length > 0 ? 'has-images' : ''}`}>
            <input
              type="file"
              id="images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <label htmlFor="images" className="upload-label">
              <div className="upload-icon">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <p className="upload-text">
                Перетащите фото или нажмите для загрузки
              </p>
              <p className="upload-hint">
                JPG, PNG. Максимум 10 фото, размер до 5МБ каждое
              </p>
            </label>
          </div>

          {previewImages.length > 0 && (
            <div className="preview-gallery">
              <h3>Загруженные фото ({previewImages.length}/10)</h3>
              <div className="preview-grid">
                {previewImages.map((preview, index) => (
                  <div key={index} className="preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-btn"
                      title="Удалить фото"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.images && <span className="error-message">{errors.images}</span>}
        </div>

        {/* Кнопка отправки */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            <i className="fas fa-check-circle"></i> Опубликовать объявление
          </button>
          <button type="reset" className="btn-secondary">
            <i className="fas fa-redo"></i> Очистить форму
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCarForm;
