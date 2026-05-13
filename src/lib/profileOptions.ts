export type IntentionType = 'seek_room' | 'offer_room' | 'seek_flatmate';

export const AUTONOMOUS_COMMUNITIES = [
  'Andalucía',
  'Aragón',
  'Asturias',
  'Baleares',
  'Canarias',
  'Cantabria',
  'Castilla-La Mancha',
  'Castilla y León',
  'Cataluña',
  'Ceuta',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Madrid',
  'Melilla',
  'Murcia',
  'Navarra',
  'País Vasco',
  'Valencia',
];

export const PROVINCES: Record<string, string[]> = {
  Andalucía: ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla'],
  Aragón: ['Huesca', 'Teruel', 'Zaragoza'],
  Asturias: ['Asturias'],
  Baleares: ['Baleares'],
  Canarias: ['Las Palmas', 'Santa Cruz de Tenerife'],
  Cantabria: ['Cantabria'],
  'Castilla-La Mancha': ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo'],
  'Castilla y León': ['Ávila', 'Burgos', 'León', 'Palencia', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora'],
  Cataluña: ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
  Ceuta: ['Ceuta'],
  Extremadura: ['Badajoz', 'Cáceres'],
  Galicia: ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra'],
  'La Rioja': ['La Rioja'],
  Madrid: ['Madrid'],
  Melilla: ['Melilla'],
  Murcia: ['Murcia'],
  Navarra: ['Navarra'],
  'País Vasco': ['Álava', 'Guipúzcoa', 'Vizcaya'],
  Valencia: ['Alicante', 'Castellón', 'Valencia'],
};

export const LANGUAGE_OPTIONS = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'it', label: 'Italiano' },
  { id: 'pt', label: 'Português' },
  { id: 'zh', label: '中文' },
  { id: 'ar', label: 'العربية' },
];

export const PROFILE_PHOTO_LIMIT = 2;
export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_CITY_LENGTH = 80;
export const MAX_PROVINCE_LENGTH = 80;
export const MAX_OCCUPATION_LENGTH = 100;
export const MIN_BIO_LENGTH = 20;
export const MAX_BIO_LENGTH = 500;
export const MAX_BUDGET = 10000;
export const MIN_STAY_OPTIONS = [1, 2, 3, 6, 9, 12];

export const normalizeLanguage = (language: string) => {
  const option = LANGUAGE_OPTIONS.find(
    (item) => item.id === language || item.label === language
  );

  return option?.id ?? language;
};

export const getLanguageLabel = (language: string) => {
  const option = LANGUAGE_OPTIONS.find(
    (item) => item.id === language || item.label === language
  );

  return option?.label ?? language;
};

export const todayIso = () => new Date().toISOString().split('T')[0];
export const toPositiveNumber = (value: string) => Number(value);
