type YesNoValue = 'yes' | 'no' | '';
type HouseholdSizeValue = 'solo' | 'pair' | 'group_3_plus' | '';
type PropertyContextValue = 'shared_flat' | 'family_home' | 'owner_occupied_flat' | '';
type SeekerGoalValue = 'need_room_now' | 'want_flatmate_then_home' | 'open_to_both' | '';

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
export type SeekFlatmateDetailsForm = SeekerDetailsForm;

export type OfferDetailsForm = {
  propertyContext: PropertyContextValue;
  currentHouseholdCount: string;
  allowsCouples: YesNoValue;
  allowsTwoPeople: YesNoValue;
  allowsMinors: YesNoValue;
  allowsPets: YesNoValue;
  allowsSmoking: YesNoValue;
};

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Si' },
  { value: 'no', label: 'No' },
] as const;

export const HOUSEHOLD_SIZE_OPTIONS = [
  { value: 'solo', label: 'Voy solo' },
  { value: 'pair', label: 'Somos dos' },
  { value: 'group_3_plus', label: 'Somos 3 o mas' },
] as const;

export const SEEKER_GOAL_OPTIONS = [
  { value: 'need_room_now', label: 'Necesito habitacion ya' },
  { value: 'want_flatmate_then_home', label: 'Quiero encontrar companero y luego piso' },
  { value: 'open_to_both', label: 'Abierto a buscar habitacion o companero' },
] as const;

export const PROPERTY_CONTEXT_OPTIONS = [
  { value: 'shared_flat', label: 'Piso compartido' },
  { value: 'family_home', label: 'Casa familiar' },
  { value: 'owner_occupied_flat', label: 'Piso con propietario viviendo' },
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

export const decodeSeekFlatmateDetails = (value: unknown): SeekFlatmateDetailsForm =>
  decodeSeekerDetails(value);

export const decodeOfferDetails = (value: unknown): OfferDetailsForm => {
  const details = asRecord(value);

  return {
    propertyContext: readString(details.property_context, ['shared_flat', 'family_home', 'owner_occupied_flat']),
    currentHouseholdCount:
      typeof details.current_household_count === 'number'
        ? String(details.current_household_count)
        : '',
    allowsCouples: readBooleanString(details.allows_couples),
    allowsTwoPeople: readBooleanString(details.allows_two_people),
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

export const encodeSeekFlatmateDetails = (
  existingValue: unknown,
  details: SeekFlatmateDetailsForm
) => encodeSeekerDetails(existingValue, details);

export const encodeOfferDetails = (
  existingValue: unknown,
  details: OfferDetailsForm
) => {
  const existing = asRecord(existingValue);
  const householdCount = Number(details.currentHouseholdCount);

  return {
    ...existing,
    property_context: details.propertyContext || null,
    current_household_count: Number.isFinite(householdCount) && householdCount >= 0 ? householdCount : null,
    allows_couples: details.allowsCouples ? details.allowsCouples === 'yes' : null,
    allows_two_people: details.allowsTwoPeople ? details.allowsTwoPeople === 'yes' : null,
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

export const getSeekerGoalLabel = (value: SeekerGoalValue) => {
  const option = SEEKER_GOAL_OPTIONS.find((item) => item.value === value);
  return option?.label ?? null;
};
