type YesNoValue = 'yes' | 'no' | '';
type HouseholdSizeValue = 'solo' | 'pair' | 'group_3_plus' | '';
type PropertyContextValue = 'shared_flat' | 'family_home' | 'owner_occupied_flat' | '';
type SeekerGoalValue = 'need_room_now' | 'want_flatmate_then_home' | 'open_to_both' | '';
type OccupancyPolicyValue = 'single_only' | 'couple' | 'two_people' | 'to_agree' | '';

export type LivingTraitsForm = {
  isSmoker: YesNoValue;
  hasPet: YesNoValue;
  householdSize: HouseholdSizeValue;
  includesMinor: YesNoValue;
};

export type SeekerDetailsForm = {
  seekerGoal: SeekerGoalValue;
  acceptsSmokingHome: YesNoValue;
  acceptsPetsHome: YesNoValue;
  acceptsCouplesHome: YesNoValue;
};

export type SeekRoomDetailsForm = SeekerDetailsForm;

export type OfferDetailsForm = {
  propertyContext: PropertyContextValue;
  currentHouseholdCount: string;
  occupancyPolicy: OccupancyPolicyValue;
  allowsCouples: YesNoValue;
  allowsTwoPeople: YesNoValue;
  allowsMinors: YesNoValue;
  allowsPets: YesNoValue;
  allowsSmoking: YesNoValue;
};

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
] as const;

export const HOUSEHOLD_SIZE_OPTIONS = [
  { value: 'solo', label: 'Voy solo' },
  { value: 'pair', label: 'Somos dos' },
  { value: 'group_3_plus', label: 'Somos 3 o más' },
] as const;

export const SEEK_ROOM_GOAL_OPTIONS = [
  { value: 'need_room_now', label: 'Necesito habitación cuanto antes' },
  { value: 'want_flatmate_then_home', label: 'Busco habitación para mudarme pronto' },
  { value: 'open_to_both', label: 'Estoy mirando opciones con flexibilidad' },
] as const;

export const PROPERTY_CONTEXT_OPTIONS = [
  { value: 'shared_flat', label: 'Piso compartido' },
  { value: 'family_home', label: 'Casa familiar' },
  { value: 'owner_occupied_flat', label: 'Piso con propietario viviendo' },
] as const;

export const OCCUPANCY_POLICY_OPTIONS = [
  { value: 'single_only', label: 'Solo una persona' },
  { value: 'couple', label: 'Pareja' },
  { value: 'two_people', label: 'Dos personas' },
  { value: 'to_agree', label: 'A valorar según el caso' },
] as const;

const MANAGED_TRAIT_PREFIXES = [
  'trait_smoker_',
  'trait_pet_',
  'trait_household_',
  'trait_minor_',
];

const getTagValue = (tags: string[], prefix: string) =>
  tags.find((tag) => tag.startsWith(prefix))?.slice(prefix.length) ?? '';

const toYesNoValue = (value: string): YesNoValue =>
  value === 'yes' || value === 'no' ? value : '';

const toHouseholdSizeValue = (value: string): HouseholdSizeValue =>
  value === 'solo' || value === 'pair' || value === 'group_3_plus' ? value : '';

const readBooleanString = (value: unknown): YesNoValue => {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (value === 'yes' || value === 'no') return value;
  return '';
};

const readString = <T extends string>(value: unknown, allowed: readonly T[]): T | '' =>
  typeof value === 'string' && allowed.includes(value as T) ? (value as T) : '';

export const decodeLivingTraits = (tags: string[] | null | undefined): LivingTraitsForm => {
  const safeTags = tags ?? [];

  return {
    isSmoker: toYesNoValue(getTagValue(safeTags, 'trait_smoker_')),
    hasPet: toYesNoValue(getTagValue(safeTags, 'trait_pet_')),
    householdSize: toHouseholdSizeValue(getTagValue(safeTags, 'trait_household_')),
    includesMinor: toYesNoValue(getTagValue(safeTags, 'trait_minor_')),
  };
};

export const encodeLivingTraits = (
  existingTags: string[] | null | undefined,
  traits: LivingTraitsForm
) => {
  const preservedTags = (existingTags ?? []).filter(
    (tag) => !MANAGED_TRAIT_PREFIXES.some((prefix) => tag.startsWith(prefix))
  );

  const managedTags = [
    traits.isSmoker ? `trait_smoker_${traits.isSmoker}` : null,
    traits.hasPet ? `trait_pet_${traits.hasPet}` : null,
    traits.householdSize ? `trait_household_${traits.householdSize}` : null,
    traits.includesMinor ? `trait_minor_${traits.includesMinor}` : null,
  ].filter((tag): tag is string => Boolean(tag));

  return [...preservedTags, ...managedTags];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const decodeSeekerDetails = (value: unknown): SeekerDetailsForm => {
  const details = asRecord(value);

  return {
    seekerGoal: readString(details.seeker_goal, ['need_room_now', 'want_flatmate_then_home', 'open_to_both']),
    acceptsSmokingHome: readBooleanString(details.accepts_smoking_home),
    acceptsPetsHome: readBooleanString(details.accepts_pets_home),
    acceptsCouplesHome: readBooleanString(details.accepts_couples_home),
  };
};

export const decodeSeekRoomDetails = (value: unknown): SeekRoomDetailsForm =>
  decodeSeekerDetails(value);

export const decodeOfferDetails = (value: unknown): OfferDetailsForm => {
  const details = asRecord(value);
  const allowsCouples = readBooleanString(details.allows_couples);
  const allowsTwoPeople = readBooleanString(details.allows_two_people);
  const occupancyPolicy =
    readString(details.occupancy_policy, ['single_only', 'couple', 'two_people', 'to_agree']) ||
    (allowsCouples === 'yes'
      ? 'couple'
      : allowsTwoPeople === 'yes'
        ? 'two_people'
        : allowsCouples === 'no' && allowsTwoPeople === 'no'
          ? 'single_only'
          : '');

  return {
    propertyContext: readString(details.property_context, ['shared_flat', 'family_home', 'owner_occupied_flat']),
    currentHouseholdCount:
      typeof details.current_household_count === 'number'
        ? String(details.current_household_count)
        : '',
    occupancyPolicy,
    allowsCouples,
    allowsTwoPeople,
    allowsMinors: readBooleanString(details.allows_minors),
    allowsPets: readBooleanString(details.allows_pets),
    allowsSmoking: readBooleanString(details.allows_smoking),
  };
};

export const encodeSeekerDetails = (
  existingValue: unknown,
  details: SeekerDetailsForm
) => {
  const existing = asRecord(existingValue);

  return {
    ...existing,
    seeker_goal: details.seekerGoal || null,
    accepts_smoking_home: details.acceptsSmokingHome ? details.acceptsSmokingHome === 'yes' : null,
    accepts_pets_home: details.acceptsPetsHome ? details.acceptsPetsHome === 'yes' : null,
    accepts_couples_home: details.acceptsCouplesHome ? details.acceptsCouplesHome === 'yes' : null,
  };
};

export const encodeSeekRoomDetails = (
  existingValue: unknown,
  details: SeekRoomDetailsForm
) => encodeSeekerDetails(existingValue, details);

export const encodeOfferDetails = (
  existingValue: unknown,
  details: OfferDetailsForm
) => {
  const existing = asRecord(existingValue);
  const householdCount = Number(details.currentHouseholdCount);
  const allowsCouples =
    details.occupancyPolicy === 'couple' || details.occupancyPolicy === 'to_agree'
      ? true
      : details.occupancyPolicy
        ? false
        : details.allowsCouples
          ? details.allowsCouples === 'yes'
          : null;
  const allowsTwoPeople =
    details.occupancyPolicy === 'two_people' || details.occupancyPolicy === 'to_agree'
      ? true
      : details.occupancyPolicy
        ? false
        : details.allowsTwoPeople
          ? details.allowsTwoPeople === 'yes'
          : null;

  return {
    ...existing,
    property_context: details.propertyContext || null,
    current_household_count: Number.isFinite(householdCount) && householdCount >= 0 ? householdCount : null,
    occupancy_policy: details.occupancyPolicy || null,
    allows_couples: allowsCouples,
    allows_two_people: allowsTwoPeople,
    allows_minors: details.allowsMinors ? details.allowsMinors === 'yes' : null,
    allows_pets: details.allowsPets ? details.allowsPets === 'yes' : null,
    allows_smoking: details.allowsSmoking ? details.allowsSmoking === 'yes' : null,
  };
};

export const getYesNoLabel = (value: YesNoValue, positive: string, negative: string) => {
  if (value === 'yes') return positive;
  if (value === 'no') return negative;
  return null;
};

export const getHouseholdSizeLabel = (value: HouseholdSizeValue) => {
  const option = HOUSEHOLD_SIZE_OPTIONS.find((item) => item.value === value);
  return option?.label ?? null;
};

export const getPropertyContextLabel = (value: PropertyContextValue) => {
  const option = PROPERTY_CONTEXT_OPTIONS.find((item) => item.value === value);
  return option?.label ?? null;
};

export const getOccupancyPolicyLabel = (value: OccupancyPolicyValue) => {
  const option = OCCUPANCY_POLICY_OPTIONS.find((item) => item.value === value);
  return option?.label ?? null;
};

export const getSeekRoomGoalLabel = (value: SeekerGoalValue) => {
  const option = SEEK_ROOM_GOAL_OPTIONS.find((item) => item.value === value);
  return option?.label ?? null;
};

export const PROFILE_INTEREST_TAG_PREFIX = 'interest_';
export const PROFILE_INTEREST_TAG_LIMIT = 25;

export type ProfileInterestCategory = {
  id: string;
  title: string;
  helper: string;
  options: readonly string[];
};

export const PROFILE_INTEREST_CATEGORIES: readonly ProfileInterestCategory[] = [
  {
    id: 'personality',
    title: 'Cómo eres',
    helper: 'Rasgos personales que ayudan a intuir el trato diario y la conexión con otras personas.',
    options: [
      'Tranquilo/a', 'Sociable', 'Reservado/a', 'Comunicativo/a', 'Empático/a', 'Flexible',
      'Ordenado/a', 'Creativo/a', 'Optimista', 'De trato fácil', 'Puntual', 'Paciente',
      'Resolutivo/a', 'Independiente', 'Conversador/a', 'Discreto/a', 'Cuidadoso/a',
      'Directo/a', 'Abierto/a', 'Organizado/a', 'Respetuoso/a', 'Honesto/a',
      'Responsable', 'Afectuoso/a', 'Observador/a', 'Colaborador/a', 'Detallista',
      'Práctico/a', 'Curioso/a', 'Sereno/a',
    ],
  },
  {
    id: 'lifestyle',
    title: 'Estilo de vida',
    helper: 'Pistas sobre tu ritmo, energía y forma de disfrutar el día a día.',
    options: [
      'Casero/a', 'Aventurero/a', 'Vida activa', 'Rutina tranquila', 'Planes improvisados',
      'Cuida el descanso', 'Le gusta cocinar', 'Sale los fines de semana',
      'Prefiere planes tranquilos', 'Madrugador/a', 'Nocturno/a', 'Saludable', 'Foodie',
      'Viajero/a', 'Deportista', 'Cultural', 'Naturaleza', 'Vida sencilla',
      'Agenda organizada', 'Espontáneo/a', 'Le gusta desconectar', 'Muy familiar',
      'Ambiente relajado', 'Le gusta aprender', 'Mascotas friendly',
    ],
  },
  {
    id: 'plans',
    title: 'Planes e intereses',
    helper: 'Temas y planes que pueden abrir conversación con personas afines.',
    options: [
      'Cine', 'Series', 'Lectura', 'Cocinar', 'Café tranquilo', 'Conciertos', 'Museos',
      'Juegos de mesa', 'Fotografía', 'Tecnología', 'Terrazas', 'Naturaleza', 'Viajes',
      'Videojuegos', 'Teatro', 'Arte', 'Pasear', 'Gastronomía', 'Voluntariado',
      'Idiomas', 'Podcasts', 'Animales', 'Manualidades', 'Mercadillos', 'Escape rooms',
      'Debates tranquilos', 'Planes culturales', 'Excursiones', 'Brunch', 'Karaoke',
    ],
  },
  {
    id: 'music',
    title: 'Música',
    helper: 'Gustos musicales si quieres mostrarlos en tu perfil.',
    options: [
      'Pop', 'Rock', 'Indie', 'Electrónica', 'Hip-hop', 'Latina', 'Clásica', 'Jazz',
      'Reggae', 'Metal', 'Techno', 'House', 'Flamenco', 'Reguetón', 'R&B', 'Soul',
      'Folk', 'Punk', 'Alternativa', 'Blues', 'Country', 'Trap', 'Salsa', 'Bachata',
      'Funk', 'Lo-fi', 'Cantautor/a', 'Dance', 'Afrobeat', 'K-pop',
    ],
  },
  {
    id: 'sports',
    title: 'Deportes',
    helper: 'Actividades que practicas o te interesan.',
    options: [
      'Gimnasio', 'Running', 'Yoga', 'Ciclismo', 'Natación', 'Fútbol', 'Baloncesto',
      'Pádel', 'Senderismo', 'Baile', 'Pilates', 'Crossfit', 'Boxeo', 'Tenis', 'Surf',
      'Montaña', 'Artes marciales', 'Patinaje', 'Calistenia', 'Escalada', 'Voleibol',
      'Rugby', 'Golf', 'Esquí', 'Snowboard', 'Skate', 'Bici urbana', 'Entreno en casa',
      'Meditación', 'Estiramientos',
    ],
  },
] as const;

const normalizeInterestTag = (label: string) =>
  label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const toProfileInterestTag = (label: string) =>
  `${PROFILE_INTEREST_TAG_PREFIX}${normalizeInterestTag(label)}`;

export const decodeProfileInterestTags = (tags: string[] | null | undefined) => {
  const safeTags = new Set(tags ?? []);
  const options = PROFILE_INTEREST_CATEGORIES.flatMap((category) => category.options);

  return options.filter((option) => safeTags.has(toProfileInterestTag(option)));
};

export const encodeProfileInterestTags = (
  existingTags: string[] | null | undefined,
  selectedLabels: string[]
) => {
  const preservedTags = (existingTags ?? []).filter(
    (tag) => !tag.startsWith(PROFILE_INTEREST_TAG_PREFIX)
  );
  const selectedTags = selectedLabels
    .slice(0, PROFILE_INTEREST_TAG_LIMIT)
    .map(toProfileInterestTag);

  return Array.from(new Set([...preservedTags, ...selectedTags]));
};