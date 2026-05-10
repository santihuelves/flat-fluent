import type { Json } from '@/integrations/supabase/types';

export const visitsPolicyOptions = [
  { value: 'no', label: 'No se permiten visitas' },
  { value: 'occasional', label: 'Visitas ocasionales' },
  { value: 'with_notice', label: 'Con aviso previo' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const homeEnvironmentOptions = [
  { value: 'quiet', label: 'Tranquilo' },
  { value: 'family', label: 'Familiar' },
  { value: 'students', label: 'De estudiantes' },
  { value: 'workers', label: 'De trabajadores' },
  { value: 'mixed', label: 'Mixto' },
] as const;

export const occupancyPolicyOptions = [
  { value: 'single_only', label: 'Solo una persona' },
  { value: 'couple', label: 'Pareja' },
  { value: 'two_people', label: 'Dos personas' },
  { value: 'to_agree', label: 'A valorar segun el caso' },
] as const;

const booleanOptions = new Set(['yes', 'no']);
const visitsPolicyValues = new Set(visitsPolicyOptions.map((option) => option.value));
const homeEnvironmentValues = new Set(homeEnvironmentOptions.map((option) => option.value));
const occupancyPolicyValues = new Set(occupancyPolicyOptions.map((option) => option.value));

export type RoomListingDetails = {
  neighborhood?: string;
  visits_policy?: 'no' | 'occasional' | 'with_notice' | 'to_agree';
  occupancy_policy?: 'single_only' | 'couple' | 'two_people' | 'to_agree';
  allows_couples?: boolean;
  allows_two_people?: boolean;
  allows_minors?: boolean;
  current_household_count?: number;
  owner_lives_here?: boolean;
  home_environment?: 'quiet' | 'family' | 'students' | 'workers' | 'mixed';
};

export type RoomListingDetailsForm = {
  neighborhood: string;
  visitsPolicy: string;
  occupancyPolicy: string;
  allowsMinors: '' | 'yes' | 'no';
  currentHouseholdCount: string;
  ownerLivesHere: '' | 'yes' | 'no';
  homeEnvironment: string;
};

export const emptyRoomListingDetailsForm = (): RoomListingDetailsForm => ({
  neighborhood: '',
  visitsPolicy: '',
  occupancyPolicy: '',
  allowsMinors: '',
  currentHouseholdCount: '',
  ownerLivesHere: '',
  homeEnvironment: '',
});

const isObject = (value: Json | null | undefined): value is Record<string, Json | undefined> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getBooleanFormValue = (value: boolean | undefined): RoomListingDetailsForm['allowsCouples'] => {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
};

export const normalizeRoomListingDetails = (value: Json | null | undefined): RoomListingDetails => {
  if (!isObject(value)) return {};

  const details: RoomListingDetails = {};

  if (typeof value.neighborhood === 'string' && value.neighborhood.trim() !== '') {
    details.neighborhood = value.neighborhood.trim();
  }

  if (typeof value.visits_policy === 'string' && visitsPolicyValues.has(value.visits_policy)) {
    details.visits_policy = value.visits_policy as RoomListingDetails['visits_policy'];
  }

  if (typeof value.allows_couples === 'boolean') {
    details.allows_couples = value.allows_couples;
  }

  if (typeof value.allows_two_people === 'boolean') {
    details.allows_two_people = value.allows_two_people;
  }

  if (typeof value.occupancy_policy === 'string' && occupancyPolicyValues.has(value.occupancy_policy)) {
    details.occupancy_policy = value.occupancy_policy as RoomListingDetails['occupancy_policy'];
  } else if (details.allows_couples === true) {
    details.occupancy_policy = 'couple';
  } else if (details.allows_two_people === true) {
    details.occupancy_policy = 'two_people';
  } else if (details.allows_couples === false && details.allows_two_people === false) {
    details.occupancy_policy = 'single_only';
  }

  if (typeof value.allows_minors === 'boolean') {
    details.allows_minors = value.allows_minors;
  }

  if (typeof value.current_household_count === 'number' && Number.isFinite(value.current_household_count)) {
    details.current_household_count = value.current_household_count;
  }

  if (typeof value.owner_lives_here === 'boolean') {
    details.owner_lives_here = value.owner_lives_here;
  }

  if (typeof value.home_environment === 'string' && homeEnvironmentValues.has(value.home_environment)) {
    details.home_environment = value.home_environment as RoomListingDetails['home_environment'];
  }

  return details;
};

export const roomListingDetailsFormFromDetails = (value: Json | null | undefined): RoomListingDetailsForm => {
  const details = normalizeRoomListingDetails(value);

  return {
    neighborhood: details.neighborhood ?? '',
    visitsPolicy: details.visits_policy ?? '',
    occupancyPolicy: details.occupancy_policy ?? '',
    allowsMinors: getBooleanFormValue(details.allows_minors),
    currentHouseholdCount: details.current_household_count?.toString() ?? '',
    ownerLivesHere: getBooleanFormValue(details.owner_lives_here),
    homeEnvironment: details.home_environment ?? '',
  };
};

const parseBooleanField = (value: RoomListingDetailsForm['allowsCouples']) => {
  if (!booleanOptions.has(value)) return undefined;
  return value === 'yes';
};

export const buildRoomListingDetailsFromForm = (form: RoomListingDetailsForm): RoomListingDetails => {
  const details: RoomListingDetails = {};

  const neighborhood = form.neighborhood.trim();
  if (neighborhood) {
    details.neighborhood = neighborhood;
  }

  if (visitsPolicyValues.has(form.visitsPolicy)) {
    details.visits_policy = form.visitsPolicy as RoomListingDetails['visits_policy'];
  }

  if (occupancyPolicyValues.has(form.occupancyPolicy)) {
    details.occupancy_policy = form.occupancyPolicy as RoomListingDetails['occupancy_policy'];
  }

  const allowsMinors = parseBooleanField(form.allowsMinors);
  if (typeof allowsMinors === 'boolean') {
    details.allows_minors = allowsMinors;
  }

  const ownerLivesHere = parseBooleanField(form.ownerLivesHere);
  if (typeof ownerLivesHere === 'boolean') {
    details.owner_lives_here = ownerLivesHere;
  }

  const currentHouseholdCount = form.currentHouseholdCount.trim();
  if (currentHouseholdCount !== '') {
    details.current_household_count = Number(currentHouseholdCount);
  }

  if (homeEnvironmentValues.has(form.homeEnvironment)) {
    details.home_environment = form.homeEnvironment as RoomListingDetails['home_environment'];
  }

  return details;
};

export const getRoomListingDetailItems = (details: RoomListingDetails) => {
  const items: Array<{ label: string; value: string }> = [];

  if (details.visits_policy) {
    const label = visitsPolicyOptions.find((option) => option.value === details.visits_policy)?.label;
  if (label) {
      items.push({ label: 'Visitas', value: label });
    }
  }

  if (details.occupancy_policy) {
    const label = occupancyPolicyOptions.find((option) => option.value === details.occupancy_policy)?.label;
    if (label) {
      items.push({ label: 'Disponible para', value: label });
    }
  }

  if (typeof details.allows_minors === 'boolean') {
    items.push({ label: 'Menores', value: details.allows_minors ? 'Se aceptan' : 'No se aceptan' });
  }

  if (typeof details.current_household_count === 'number') {
    items.push({
      label: 'Personas viviendo ahora',
      value: details.current_household_count === 1 ? '1 persona' : `${details.current_household_count} personas`,
    });
  }

  if (typeof details.owner_lives_here === 'boolean') {
    items.push({ label: 'Propietario vive en la vivienda', value: details.owner_lives_here ? 'Si' : 'No' });
  }

  if (details.home_environment) {
    const label = homeEnvironmentOptions.find((option) => option.value === details.home_environment)?.label;
    if (label) {
      items.push({ label: 'Ambiente del piso', value: label });
    }
  }

  return items;
};
