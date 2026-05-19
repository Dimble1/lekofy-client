export const categories = [
  {
    id: 'cars',
    label: 'Машины',
    icon: 'fa-car',
    extraFields: [
      { name: 'brand', label: 'Марка', type: 'select', icon: 'fa-car', options: [
          'Toyota','BMW','Mercedes-Benz','Audi','Volkswagen','Honda','Nissan','Ford','Hyundai','Kia','Mazda','Subaru','Volvo','Tesla','Lexus','Skoda','Chevrolet','Renault','Peugeot','Citroen'
        ] },
      { name: 'model', label: 'Модель', type: 'text', icon: 'fa-tag' },
      { name: 'year', label: 'Год выпуска', type: 'number', icon: 'fa-calendar' },
      { name: 'engine_volume', label: 'Объем двигателя', type: 'number', icon: 'fa-flask' },
      { name: 'mileage', label: 'Пробег', type: 'number', icon: 'fa-tachometer-alt' },
      { name: 'color', label: 'Цвет', type: 'text', icon: 'fa-palette' },
      { name: 'steering_wheel', label: 'Руль', type: 'select', icon: 'fa-steering-wheel', options: ['Левый','Правый'] },
      { name: 'payment_type', label: 'Тип расчета', type: 'select', icon: 'fa-coins', options: ['Наличные','Безналичный','Обмен','Рассрочка'] },
      { name: 'country', label: 'Страна учета', type: 'select', icon: 'fa-globe', options: ['Кыргызстан','Казахстан','Россия','Армения'] },
    ],
  },
  {
    id: 'electronics',
    label: 'Электроника',
    icon: 'fa-mobile-alt',
    extraFields: [
      { name: 'brand', label: 'Бренд', type: 'text', icon: 'fa-tag' },
      { name: 'model', label: 'Модель', type: 'text', icon: 'fa-tag' },
      { name: 'condition', label: 'Состояние', type: 'select', icon: 'fa-check-circle', options: ['Новый','Как новый','В наличии','Б/у'] },
      { name: 'purchaseYear', label: 'Год покупки', type: 'number', icon: 'fa-calendar' },
      { name: 'warranty', label: 'Гарантия (мес)', type: 'number', icon: 'fa-shield-alt' },
    ],
  },
  {
    id: 'real_estate',
    label: 'Недвижимость',
    icon: 'fa-home',
    extraFields: [
      { name: 'type', label: 'Тип недвижимости', type: 'select', icon: 'fa-building', options: ['Квартира','Дом','Комната','Земля'] },
      { name: 'area', label: 'Площадь (м²)', type: 'number', icon: 'fa-ruler-combined' },
      { name: 'rooms', label: 'Количество комнат', type: 'number', icon: 'fa-door-open' },
      { name: 'floor', label: 'Этаж', type: 'number', icon: 'fa-layer-group' },
    ],
  },
  {
    id: 'clothing',
    label: 'Одежда и аксессуары',
    icon: 'fa-tshirt',
    extraFields: [
      { name: 'brand', label: 'Бренд', type: 'text', icon: 'fa-tag' },
      { name: 'size', label: 'Размер', type: 'text', icon: 'fa-ruler' },
      { name: 'condition', label: 'Состояние', type: 'select', icon: 'fa-check-circle', options: ['Новый','Б/у'] },
    ],
  },
  {
    id: 'services',
    label: 'Услуги',
    icon: 'fa-concierge-bell',
    extraFields: [
      { name: 'serviceType', label: 'Тип услуги', type: 'text', icon: 'fa-tools' },
      { name: 'experience', label: 'Опыт работы (лет)', type: 'number', icon: 'fa-briefcase' },
      { name: 'rate', label: 'Цена за услугу', type: 'number', icon: 'fa-money-bill-wave' },
      { name: 'district', label: 'Район', type: 'text', icon: 'fa-map-marker-alt' },
    ],
  },
  {
    id: 'jobs',
    label: 'Работа',
    icon: 'fa-briefcase',
    extraFields: [
      { name: 'position', label: 'Должность', type: 'text', icon: 'fa-briefcase' },
      { name: 'experience', label: 'Опыт (лет)', type: 'number', icon: 'fa-clock' },
      { name: 'salary', label: 'Зарплата', type: 'number', icon: 'fa-money-bill-wave' },
    ],
  },
  {
    id: 'home_garden',
    label: 'Дом и сад',
    icon: 'fa-seedling',
    extraFields: [
      { name: 'type', label: 'Тип товара', type: 'text', icon: 'fa-tag' },
      { name: 'condition', label: 'Состояние', type: 'select', icon: 'fa-check-circle', options: ['Новый','Б/у'] },
    ],
  },
  {
    id: 'sports',
    label: 'Спорт и хобби',
    icon: 'fa-football-ball',
    extraFields: [
      { name: 'type', label: 'Вид спорта', type: 'text', icon: 'fa-tag' },
      { name: 'condition', label: 'Состояние', type: 'select', icon: 'fa-check-circle', options: ['Новый','Б/у'] },
    ],
  },
  {
    id: 'kids',
    label: 'Детские товары',
    icon: 'fa-baby',
    extraFields: [
      { name: 'age', label: 'Возраст (лет)', type: 'number', icon: 'fa-child' },
      { name: 'condition', label: 'Состояние', type: 'select', icon: 'fa-check-circle', options: ['Новый','Б/у'] },
    ],
  },
  {
    id: 'pets',
    label: 'Животные',
    icon: 'fa-paw',
    extraFields: [
      { name: 'animalType', label: 'Животное', type: 'text', icon: 'fa-paw' },
      { name: 'age', label: 'Возраст (лет)', type: 'number', icon: 'fa-child' },
    ],
  },
  {
    id: 'other',
    label: 'Разное',
    icon: 'fa-ellipsis-h',
    extraFields: [],
  },
];
