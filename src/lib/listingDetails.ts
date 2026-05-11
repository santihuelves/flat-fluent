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
  { value: 'to_agree', label: 'A valorar según el caso' },
] as const;

export const preferredGenderOptions = [
  { value: 'any', label: 'El género da igual' },
  { value: 'woman', label: 'Mujer' },
  { value: 'man', label: 'Hombre' },
  { value: 'non_binary', label: 'No binario' },
  { value: 'other', label: 'Otro' },
] as const;

export const contractAvailableOptions = [
  { value: 'yes', label: 'Sí, contrato escrito' },
  { value: 'no', label: 'No' },
  { value: 'to_agree', label: 'A concretar' },
] as const;

export const registrationAllowedOptions = [
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'to_agree', label: 'A consultar' },
] as const;

export const noticePeriodOptions = [
  { value: '15_days', label: '15 días' },
  { value: '1_month', label: '1 mes' },
  { value: '2_months', label: '2 meses' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

const booleanOptions = new Set(['yes', 'no']);
const visitsPolicyValues = new Set(visitsPolicyOptions.map((option) => option.value));
const homeEnvironmentValues = new Set(homeEnvironmentOptions.map((option) => option.value));
const occupancyPolicyValues = new Set(occupancyPolicyOptions.map((option) => option.value));
const preferredGenderValues = new Set(preferredGenderOptions.map((option) => option.value));
const contractAvailableValues = new Set(contractAvailableOptions.map((option) => option.value));
const registrationAllowedValues = new Set(registrationAllowedOptions.map((option) => option.value));
const noticePeriodValues = new Set(noticePeriodOptions.map((option) => option.value));

export type RoomListingDetails = {
  neighborhood?: string;
  preferred_age_min?: number;
  preferred_age_max?: number;
  preferred_gender?: 'any' | 'woman' | 'man' | 'non_binary' | 'other';
  expenses_estimate_monthly?: number;
  deposit_amount?: number;
  contract_available?: 'yes' | 'no' | 'to_agree';
  registration_allowed?: 'yes' | 'no' | 'to_agree';
  notice_period?: '15_days' | '1_month' | '2_months' | 'to_agree';
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
  preferredAgeMin: string;
  preferredAgeMax: string;
  preferredGender: string;
  expensesEstimateMonthly: string;
  depositAmount: string;
  contractAvailable: string;
  registrationAllowed: string;
  noticePeriod: string;
  visitsPolicy: string;
  occupancyPolicy: string;
  allowsMinors: '' | 'yes' | 'no';
  currentHouseholdCount: string;
  ownerLivesHere: '' | 'yes' | 'no';
  homeEnvironment: string;
};

export const emptyRoomListingDetailsForm = (): RoomListingDetailsForm => ({
  neighborhood: '',
  preferredAgeMin: '',
  preferredAgeMax: '',
  preferredGender: '',
  expensesEstimateMonthly: '',
  depositAmount: '',
  contractAvailable: '',
  registrationAllowed: '',
  noticePeriod: '',
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

const getBooleanFormValue = (value: boolean | undefined): RoomListingDetailsForm['allowsMinors'] => {
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

  if (typeof value.preferred_age_min === 'number' && Number.isFinite(value.preferred_age_min)) {
    details.preferred_age_min = value.preferred_age_min;
  }

  if (typeof value.preferred_age_max === 'number' && Number.isFinite(value.preferred_age_max)) {
    details.preferred_age_max = value.preferred_age_max;
  }

  if (typeof value.preferred_gender === 'string' && preferredGenderValues.has(value.preferred_gender)) {
    details.preferred_gender = value.preferred_gender as RoomListingDetails['preferred_gender'];
  }

  if (typeof value.expenses_estimate_monthly === 'number' && Number.isFinite(value.expenses_estimate_monthly)) {
    details.expenses_estimate_monthly = value.expenses_estimate_monthly;
  }

  if (typeof value.deposit_amount === 'number' && Number.isFinite(value.deposit_amount)) {
    details.deposit_amount = value.deposit_amount;
  }

  if (typeof value.contract_available === 'string' && contractAvailableValues.has(value.contract_available)) {
    details.contract_available = value.contract_available as RoomListingDetails['contract_available'];
  }

  if (typeof value.registration_allowed === 'string' && registrationAllowedValues.has(value.registration_allowed)) {
    details.registration_allowed = value.registration_allowed as RoomListingDetails['registration_allowed'];
  }

  if (typeof value.notice_period === 'string' && noticePeriodValues.has(value.notice_period)) {
    details.notice_period = value.notice_period as RoomListingDetails['notice_period'];
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
    preferredAgeMin: details.preferred_age_min?.toString() ?? '',
    preferredAgeMax: details.preferred_age_max?.toString() ?? '',
    preferredGender: details.preferred_gender ?? '',
    expensesEstimateMonthly: details.expenses_estimate_monthly?.toString() ?? '',
    depositAmount: details.deposit_amount?.toString() ?? '',
    contractAvailable: details.contract_available ?? '',
    registrationAllowed: details.registration_allowed ?? '',
    noticePeriod: details.notice_period ?? '',
    visitsPolicy: details.visits_policy ?? '',
    occupancyPolicy: details.occupancy_policy ?? '',
    allowsMinors: getBooleanFormValue(details.allows_minors),
    currentHouseholdCount: details.current_household_count?.toString() ?? '',
    ownerLivesHere: getBooleanFormValue(details.owner_lives_here),
    homeEnvironment: details.home_environment ?? '',
  };
};

const parseBooleanField = (value: RoomListingDetailsForm['allowsMinors']) => {
  if (!booleanOptions.has(value)) return undefined;
  return value === 'yes';
};

export const buildRoomListingDetailsFromForm = (form: RoomListingDetailsForm): RoomListingDetails => {
  const details: RoomListingDetails = {};

  const neighborhood = form.neighborhood.trim();
  if (neighborhood) {
    details.neighborhood = neighborhood;
  }

  const preferredAgeMin = form.preferredAgeMin.trim();
  if (preferredAgeMin !== '') {
    details.preferred_age_min = Number(preferredAgeMin);
  }

  const preferredAgeMax = form.preferredAgeMax.trim();
  if (preferredAgeMax !== '') {
    details.preferred_age_max = Number(preferredAgeMax);
  }

  if (preferredGenderValues.has(form.preferredGender)) {
    details.preferred_gender = form.preferredGender as RoomListingDetails['preferred_gender'];
  }

  const expensesEstimateMonthly = form.expensesEstimateMonthly.trim();
  if (expensesEstimateMonthly !== '') {
    details.expenses_estimate_monthly = Number(expensesEstimateMonthly);
  }

  const depositAmount = form.depositAmount.trim();
  if (depositAmount !== '') {
    details.deposit_amount = Number(depositAmount);
  }

  if (contractAvailableValues.has(form.contractAvailable)) {
    details.contract_available = form.contractAvailable as RoomListingDetails['contract_available'];
  }

  if (registrationAllowedValues.has(form.registrationAllowed)) {
    details.registration_allowed = form.registrationAllowed as RoomListingDetails['registration_allowed'];
  }

  if (noticePeriodValues.has(form.noticePeriod)) {
    details.notice_period = form.noticePeriod as RoomListingDetails['notice_period'];
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

  if (typeof details.current_household_count === 'number') {
    items.push({
      label: 'Personas viviendo ahora',
      value: details.current_household_count === 1 ? '1 persona' : `${details.current_household_count} personas`,
    });
  }

  if (typeof details.owner_lives_here === 'boolean') {
    items.push({ label: 'Propietario vive en la vivienda', value: details.owner_lives_here ? 'Sí' : 'No' });
  }

  if (details.home_environment) {
    const label = homeEnvironmentOptions.find((option) => option.value === details.home_environment)?.label;
    if (label) {
      items.push({ label: 'Ambiente del piso', value: label });
    }
  }

  return items;
};

export const getRoomListingMoneyItems = (details: RoomListingDetails) => {
  const items: Array<{ label: string; value: string }> = [];

  if (typeof details.expenses_estimate_monthly === 'number') {
    items.push({ label: 'Gastos estimados', value: `${details.expenses_estimate_monthly}€/mes` });
  }

  if (typeof details.deposit_amount === 'number') {
    items.push({ label: 'Fianza', value: details.deposit_amount > 0 ? `${details.deposit_amount}€` : 'Sin fianza' });
  }

  if (details.contract_available) {
    const label = contractAvailableOptions.find((option) => option.value === details.contract_available)?.label;
    if (label) {
      items.push({ label: 'Contrato', value: label });
    }
  }

  if (details.registration_allowed) {
    const label = registrationAllowedOptions.find((option) => option.value === details.registration_allowed)?.label;
    if (label) {
      items.push({ label: 'Empadronamiento', value: label });
    }
  }

  if (details.notice_period) {
    const label = noticePeriodOptions.find((option) => option.value === details.notice_period)?.label;
    if (label) {
      items.push({ label: 'Preaviso', value: label });
    }
  }

  return items;
};
