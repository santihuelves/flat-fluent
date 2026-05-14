import type { Json } from '@/integrations/supabase/types';

export const visitsPolicyOptions = [
  { value: 'no', label: 'No se permiten visitas' },
  { value: 'occasional', label: 'Visitas ocasionales' },
  { value: 'with_notice', label: 'Con aviso previo' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const partyPolicyOptions = [
  { value: 'no_parties', label: 'No fiestas' },
  { value: 'occasional_with_notice', label: 'Ocasionalmente y con aviso' },
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

export const depositMonthsOptions = [
  { value: '0', label: 'Sin fianza' },
  { value: '1', label: '1 mes' },
  { value: '2', label: '2 meses' },
  { value: '3', label: '3 meses' },
  { value: '4', label: '4 meses' },
  { value: '5', label: '5 meses' },
  { value: '6', label: '6 meses' },
  { value: 'to_agree', label: 'A concretar' },
] as const;

export const cleaningPolicyOptions = [
  { value: 'shared', label: 'Limpieza compartida' },
  { value: 'schedule', label: 'Turnos de limpieza' },
  { value: 'included', label: 'Limpieza incluida' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const quietHoursPolicyOptions = [
  { value: 'strict', label: 'Descanso estricto por la noche' },
  { value: 'reasonable', label: 'Ruido moderado' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const remoteWorkPolicyOptions = [
  { value: 'allowed', label: 'Teletrabajo permitido' },
  { value: 'occasional', label: 'Teletrabajo ocasional' },
  { value: 'not_ideal', label: 'No es ideal para teletrabajar' },
  { value: 'to_agree', label: 'A valorar' },
] as const;

export const kitchenUsePolicyOptions = [
  { value: 'free_use', label: 'Uso libre' },
  { value: 'with_schedule', label: 'Uso con horarios' },
  { value: 'limited', label: 'Uso limitado' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const livingRoomUsePolicyOptions = [
  { value: 'free_use', label: 'Uso libre' },
  { value: 'shared', label: 'Uso compartido' },
  { value: 'limited', label: 'Uso limitado' },
  { value: 'not_available', label: 'No disponible' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const bathroomUsePolicyOptions = [
  { value: 'shared_no_schedule', label: 'Compartido sin horarios' },
  { value: 'shared_with_organization', label: 'Compartido con organización' },
  { value: 'preferred_use', label: 'Uso preferente' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const householdGenderMixOptions = [
  { value: 'men', label: 'Solo chicos' },
  { value: 'women', label: 'Solo chicas' },
  { value: 'men_women', label: 'Chicos y chicas' },
  { value: 'diverse', label: 'Mixto / diverso' },
  { value: 'prefer_not_say', label: 'Prefiero no especificarlo' },
] as const;

export const householdOccupationOptions = [
  { value: 'workers', label: 'Trabajan' },
  { value: 'students', label: 'Estudian' },
  { value: 'workers_students', label: 'Trabajan y estudian' },
  { value: 'mixed', label: 'Mixto' },
  { value: 'to_agree', label: 'A concretar' },
] as const;

export const homeFloorOptions = [
  { value: 'ground', label: 'Bajo' },
  { value: '1', label: '1ª planta' },
  { value: '2', label: '2ª planta' },
  { value: '3', label: '3ª planta' },
  { value: '4', label: '4ª planta' },
  { value: '5', label: '5ª planta' },
  { value: '6', label: '6ª planta' },
  { value: '7_plus', label: '7ª o más' },
] as const;

export const homeOrientationOptions = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'interior', label: 'Interior' },
  { value: 'mixed', label: 'Mixto' },
] as const;

export const kitchenEquipmentOptions = [
  { value: 'fridge', label: 'Nevera' },
  { value: 'freezer', label: 'Congelador' },
  { value: 'oven', label: 'Horno' },
  { value: 'microwave', label: 'Microondas' },
  { value: 'dishwasher', label: 'Lavavajillas' },
  { value: 'ceramic_hob', label: 'Vitrocerámica / inducción' },
  { value: 'gas_stove', label: 'Cocina de gas' },
  { value: 'basic_cookware', label: 'Menaje básico' },
  { value: 'own_storage', label: 'Espacio propio en nevera/despensa' },
] as const;

export const roomWindowOptions = [
  { value: 'window', label: 'Ventana' },
  { value: 'balcony', label: 'Balcón' },
  { value: 'terrace', label: 'Terraza' },
  { value: 'none', label: 'Sin ventana exterior' },
] as const;

export const roomOrientationOptions = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'interior', label: 'Interior' },
  { value: 'courtyard', label: 'A patio' },
  { value: 'mixed', label: 'Mixta' },
] as const;

export const roomNaturalLightOptions = [
  { value: 'high', label: 'Mucha luz natural' },
  { value: 'medium', label: 'Luz natural media' },
  { value: 'low', label: 'Poca luz natural' },
  { value: 'to_agree', label: 'A valorar en visita' },
] as const;

export const roomFurnitureOptions = [
  { value: 'single_bed', label: 'Cama individual' },
  { value: 'double_bed', label: 'Cama doble' },
  { value: 'desk', label: 'Escritorio' },
  { value: 'chair', label: 'Silla' },
  { value: 'wardrobe', label: 'Armario' },
  { value: 'nightstand', label: 'Mesita' },
  { value: 'shelves', label: 'Estantería' },
  { value: 'drawers', label: 'Cómoda/cajones' },
  { value: 'tv', label: 'TV' },
] as const;

export const roomLockOptions = [
  { value: 'yes', label: 'Sí, tiene cerradura' },
  { value: 'no', label: 'No tiene cerradura' },
  { value: 'can_install', label: 'Se puede instalar' },
] as const;

export const roomBathroomOptions = [
  { value: 'private', label: 'Baño propio' },
  { value: 'shared', label: 'Baño compartido' },
  { value: 'preferred_use', label: 'Baño de uso preferente' },
  { value: 'to_agree', label: 'A acordar' },
] as const;

export const roomFurnishingStatusOptions = [
  { value: 'furnished', label: 'Amueblada' },
  { value: 'partly_furnished', label: 'Parcialmente amueblada' },
  { value: 'unfurnished', label: 'Sin amueblar' },
  { value: 'ready_to_move', label: 'Lista para entrar' },
  { value: 'to_agree', label: 'A concretar' },
] as const;

export const nearbyServiceOptions = [
  { value: 'metro', label: 'Metro' },
  { value: 'bus', label: 'Autobús' },
  { value: 'train', label: 'Tren / cercanías' },
  { value: 'supermarket', label: 'Supermercado' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'parks', label: 'Parques o zonas verdes' },
  { value: 'restaurants', label: 'Bares y restaurantes' },
  { value: 'shops', label: 'Comercios de barrio' },
] as const;

const booleanOptions = new Set(['yes', 'no']);
const visitsPolicyValues = new Set(visitsPolicyOptions.map((option) => option.value));
const partyPolicyValues = new Set(partyPolicyOptions.map((option) => option.value));
const homeEnvironmentValues = new Set(homeEnvironmentOptions.map((option) => option.value));
const occupancyPolicyValues = new Set(occupancyPolicyOptions.map((option) => option.value));
const preferredGenderValues = new Set(preferredGenderOptions.map((option) => option.value));
const contractAvailableValues = new Set(contractAvailableOptions.map((option) => option.value));
const registrationAllowedValues = new Set(registrationAllowedOptions.map((option) => option.value));
const noticePeriodValues = new Set(noticePeriodOptions.map((option) => option.value));
const depositMonthsValues = new Set(depositMonthsOptions.map((option) => option.value));
const cleaningPolicyValues = new Set(cleaningPolicyOptions.map((option) => option.value));
const quietHoursPolicyValues = new Set(quietHoursPolicyOptions.map((option) => option.value));
const remoteWorkPolicyValues = new Set(remoteWorkPolicyOptions.map((option) => option.value));
const kitchenUsePolicyValues = new Set(kitchenUsePolicyOptions.map((option) => option.value));
const livingRoomUsePolicyValues = new Set(livingRoomUsePolicyOptions.map((option) => option.value));
const bathroomUsePolicyValues = new Set(bathroomUsePolicyOptions.map((option) => option.value));
const householdGenderMixValues = new Set(householdGenderMixOptions.map((option) => option.value));
const householdOccupationValues = new Set(householdOccupationOptions.map((option) => option.value));
const homeFloorValues = new Set(homeFloorOptions.map((option) => option.value));
const homeOrientationValues = new Set(homeOrientationOptions.map((option) => option.value));
const kitchenEquipmentValues = new Set(kitchenEquipmentOptions.map((option) => option.value));
const roomWindowValues = new Set(roomWindowOptions.map((option) => option.value));
const roomOrientationValues = new Set(roomOrientationOptions.map((option) => option.value));
const roomNaturalLightValues = new Set(roomNaturalLightOptions.map((option) => option.value));
const roomFurnitureValues = new Set(roomFurnitureOptions.map((option) => option.value));
const roomLockValues = new Set(roomLockOptions.map((option) => option.value));
const roomBathroomValues = new Set(roomBathroomOptions.map((option) => option.value));
const roomFurnishingStatusValues = new Set(roomFurnishingStatusOptions.map((option) => option.value));
const nearbyServiceValues = new Set(nearbyServiceOptions.map((option) => option.value));

export type RoomListingDetails = {
  neighborhood?: string;
  address_hint?: string;
  preferred_age_min?: number;
  preferred_age_max?: number;
  preferred_gender?: 'any' | 'woman' | 'man' | 'non_binary' | 'other';
  expenses_estimate_monthly?: number;
  deposit_months?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | 'to_agree';
  deposit_amount?: number;
  contract_available?: 'yes' | 'no' | 'to_agree';
  registration_allowed?: 'yes' | 'no' | 'to_agree';
  notice_period?: '15_days' | '1_month' | '2_months' | 'to_agree';
  visits_policy?: 'no' | 'occasional' | 'with_notice' | 'to_agree';
  party_policy?: 'no_parties' | 'occasional_with_notice' | 'to_agree';
  occupancy_policy?: 'single_only' | 'couple' | 'two_people' | 'to_agree';
  allows_couples?: boolean;
  allows_two_people?: boolean;
  allows_minors?: boolean;
  current_household_count?: number;
  owner_lives_here?: boolean;
  home_environment?: 'quiet' | 'family' | 'students' | 'workers' | 'mixed';
  cleaning_policy?: 'shared' | 'schedule' | 'included' | 'to_agree';
  quiet_hours_policy?: 'strict' | 'reasonable' | 'flexible' | 'to_agree';
  remote_work_policy?: 'allowed' | 'occasional' | 'not_ideal' | 'to_agree';
  kitchen_use_policy?: 'free_use' | 'with_schedule' | 'limited' | 'to_agree';
  living_room_use_policy?: 'free_use' | 'shared' | 'limited' | 'not_available' | 'to_agree';
  bathroom_use_policy?: 'shared_no_schedule' | 'shared_with_organization' | 'preferred_use' | 'to_agree';
  household_gender_mix?: 'men' | 'women' | 'men_women' | 'diverse' | 'prefer_not_say';
  household_age_min?: number;
  household_age_max?: number;
  household_occupation?: 'workers' | 'students' | 'workers_students' | 'mixed' | 'to_agree';
  home_size_sqm?: number;
  home_floor?: 'ground' | '1' | '2' | '3' | '4' | '5' | '6' | '7_plus';
  home_orientation?: 'exterior' | 'interior' | 'mixed';
  has_elevator?: boolean;
  bedroom_count?: number;
  bathroom_count?: number;
  has_internet?: boolean;
  equipped_kitchen?: boolean;
  kitchen_equipment?: Array<(typeof kitchenEquipmentOptions)[number]['value']>;
  washing_machine?: boolean;
  room_size_sqm?: number;
  room_window?: 'window' | 'balcony' | 'terrace' | 'none';
  room_orientation?: 'exterior' | 'interior' | 'courtyard' | 'mixed';
  room_natural_light?: 'high' | 'medium' | 'low' | 'to_agree';
  room_furniture?: Array<(typeof roomFurnitureOptions)[number]['value']>;
  room_lock?: 'yes' | 'no' | 'can_install';
  room_bathroom?: 'private' | 'shared' | 'preferred_use' | 'to_agree';
  room_furnishing_status?: 'furnished' | 'partly_furnished' | 'unfurnished' | 'ready_to_move' | 'to_agree';
  nearest_transport?: string;
  transport_walk_minutes?: number;
  nearby_services?: Array<(typeof nearbyServiceOptions)[number]['value']>;
  location_notes?: string;
};

export type RoomListingDetailsForm = {
  neighborhood: string;
  addressHint: string;
  preferredAgeMin: string;
  preferredAgeMax: string;
  preferredGender: string;
  expensesEstimateMonthly: string;
  depositMonths: string;
  contractAvailable: string;
  registrationAllowed: string;
  noticePeriod: string;
  visitsPolicy: string;
  partyPolicy: string;
  occupancyPolicy: string;
  allowsMinors: '' | 'yes' | 'no';
  currentHouseholdCount: string;
  ownerLivesHere: '' | 'yes' | 'no';
  homeEnvironment: string;
  cleaningPolicy: string;
  quietHoursPolicy: string;
  remoteWorkPolicy: string;
  kitchenUsePolicy: string;
  livingRoomUsePolicy: string;
  bathroomUsePolicy: string;
  householdGenderMix: string;
  householdAgeMin: string;
  householdAgeMax: string;
  householdOccupation: string;
  homeSizeSqm: string;
  homeFloor: string;
  homeOrientation: string;
  hasElevator: '' | 'yes' | 'no';
  bedroomCount: string;
  bathroomCount: string;
  hasInternet: '' | 'yes' | 'no';
  equippedKitchen: '' | 'yes' | 'no';
  kitchenEquipment: string[];
  washingMachine: '' | 'yes' | 'no';
  roomSizeSqm: string;
  roomWindow: string;
  roomOrientation: string;
  roomNaturalLight: string;
  roomFurniture: string[];
  roomLock: string;
  roomBathroom: string;
  roomFurnishingStatus: string;
  nearestTransport: string;
  transportWalkMinutes: string;
  nearbyServices: string[];
  locationNotes: string;
};

export const emptyRoomListingDetailsForm = (): RoomListingDetailsForm => ({
  neighborhood: '',
  addressHint: '',
  preferredAgeMin: '',
  preferredAgeMax: '',
  preferredGender: '',
  expensesEstimateMonthly: '',
  depositMonths: '',
  contractAvailable: '',
  registrationAllowed: '',
  noticePeriod: '',
  visitsPolicy: '',
  partyPolicy: '',
  occupancyPolicy: '',
  allowsMinors: '',
  currentHouseholdCount: '',
  ownerLivesHere: '',
  homeEnvironment: '',
  cleaningPolicy: '',
  quietHoursPolicy: '',
  remoteWorkPolicy: '',
  kitchenUsePolicy: '',
  livingRoomUsePolicy: '',
  bathroomUsePolicy: '',
  householdGenderMix: '',
  householdAgeMin: '',
  householdAgeMax: '',
  householdOccupation: '',
  homeSizeSqm: '',
  homeFloor: '',
  homeOrientation: '',
  hasElevator: '',
  bedroomCount: '',
  bathroomCount: '',
  hasInternet: '',
  equippedKitchen: '',
  kitchenEquipment: [],
  washingMachine: '',
  roomSizeSqm: '',
  roomWindow: '',
  roomOrientation: '',
  roomNaturalLight: '',
  roomFurniture: [],
  roomLock: '',
  roomBathroom: '',
  roomFurnishingStatus: '',
  nearestTransport: '',
  transportWalkMinutes: '',
  nearbyServices: [],
  locationNotes: '',
});

const isObject = (value: Json | null | undefined): value is Record<string, Json | undefined> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const getBooleanFormValue = (value: boolean | undefined): RoomListingDetailsForm['allowsMinors'] => {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
};

export const stripLegacyNeighborhoodFromDescription = (description: string | null | undefined) => {
  return (description ?? '').replace(/\n*\s*Barrio\/Zona:\s*(.+?)\s*$/i, '').trimEnd();
};

export const normalizeRoomListingDetails = (value: Json | null | undefined): RoomListingDetails => {
  if (!isObject(value)) return {};

  const details: RoomListingDetails = {};

  if (typeof value.neighborhood === 'string' && value.neighborhood.trim() !== '') {
    details.neighborhood = value.neighborhood.trim();
  }

  if (typeof value.address_hint === 'string' && value.address_hint.trim() !== '') {
    details.address_hint = value.address_hint.trim();
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

  if (typeof value.deposit_months === 'string' && depositMonthsValues.has(value.deposit_months)) {
    details.deposit_months = value.deposit_months as RoomListingDetails['deposit_months'];
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

  if (typeof value.party_policy === 'string' && partyPolicyValues.has(value.party_policy)) {
    details.party_policy = value.party_policy as RoomListingDetails['party_policy'];
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

  if (typeof value.cleaning_policy === 'string' && cleaningPolicyValues.has(value.cleaning_policy)) {
    details.cleaning_policy = value.cleaning_policy as RoomListingDetails['cleaning_policy'];
  }

  if (typeof value.quiet_hours_policy === 'string' && quietHoursPolicyValues.has(value.quiet_hours_policy)) {
    details.quiet_hours_policy = value.quiet_hours_policy as RoomListingDetails['quiet_hours_policy'];
  }

  if (typeof value.remote_work_policy === 'string' && remoteWorkPolicyValues.has(value.remote_work_policy)) {
    details.remote_work_policy = value.remote_work_policy as RoomListingDetails['remote_work_policy'];
  }

  if (typeof value.kitchen_use_policy === 'string' && kitchenUsePolicyValues.has(value.kitchen_use_policy)) {
    details.kitchen_use_policy = value.kitchen_use_policy as RoomListingDetails['kitchen_use_policy'];
  }

  if (typeof value.living_room_use_policy === 'string' && livingRoomUsePolicyValues.has(value.living_room_use_policy)) {
    details.living_room_use_policy = value.living_room_use_policy as RoomListingDetails['living_room_use_policy'];
  }

  if (typeof value.bathroom_use_policy === 'string' && bathroomUsePolicyValues.has(value.bathroom_use_policy)) {
    details.bathroom_use_policy = value.bathroom_use_policy as RoomListingDetails['bathroom_use_policy'];
  }

  if (typeof value.household_gender_mix === 'string' && householdGenderMixValues.has(value.household_gender_mix)) {
    details.household_gender_mix = value.household_gender_mix as RoomListingDetails['household_gender_mix'];
  }

  if (typeof value.household_age_min === 'number' && Number.isFinite(value.household_age_min)) {
    details.household_age_min = value.household_age_min;
  }

  if (typeof value.household_age_max === 'number' && Number.isFinite(value.household_age_max)) {
    details.household_age_max = value.household_age_max;
  }

  if (typeof value.household_occupation === 'string' && householdOccupationValues.has(value.household_occupation)) {
    details.household_occupation = value.household_occupation as RoomListingDetails['household_occupation'];
  }

  if (typeof value.home_size_sqm === 'number' && Number.isFinite(value.home_size_sqm)) {
    details.home_size_sqm = value.home_size_sqm;
  }

  if (typeof value.home_floor === 'string' && homeFloorValues.has(value.home_floor)) {
    details.home_floor = value.home_floor as RoomListingDetails['home_floor'];
  }

  if (typeof value.home_orientation === 'string' && homeOrientationValues.has(value.home_orientation)) {
    details.home_orientation = value.home_orientation as RoomListingDetails['home_orientation'];
  }

  if (typeof value.has_elevator === 'boolean') {
    details.has_elevator = value.has_elevator;
  }

  if (typeof value.bedroom_count === 'number' && Number.isFinite(value.bedroom_count)) {
    details.bedroom_count = value.bedroom_count;
  }

  if (typeof value.bathroom_count === 'number' && Number.isFinite(value.bathroom_count)) {
    details.bathroom_count = value.bathroom_count;
  }

  if (typeof value.has_internet === 'boolean') {
    details.has_internet = value.has_internet;
  }

  if (typeof value.equipped_kitchen === 'boolean') {
    details.equipped_kitchen = value.equipped_kitchen;
  }

  if (Array.isArray(value.kitchen_equipment)) {
    const kitchenEquipment = value.kitchen_equipment.filter((item): item is (typeof kitchenEquipmentOptions)[number]['value'] => {
      return typeof item === 'string' && kitchenEquipmentValues.has(item);
    });

    if (kitchenEquipment.length > 0) {
      details.kitchen_equipment = kitchenEquipment;
    }
  }

  if (typeof value.washing_machine === 'boolean') {
    details.washing_machine = value.washing_machine;
  }

  if (typeof value.room_size_sqm === 'number' && Number.isFinite(value.room_size_sqm)) {
    details.room_size_sqm = value.room_size_sqm;
  }

  if (typeof value.room_window === 'string' && roomWindowValues.has(value.room_window)) {
    details.room_window = value.room_window as RoomListingDetails['room_window'];
  }

  if (typeof value.room_orientation === 'string' && roomOrientationValues.has(value.room_orientation)) {
    details.room_orientation = value.room_orientation as RoomListingDetails['room_orientation'];
  }

  if (typeof value.room_natural_light === 'string' && roomNaturalLightValues.has(value.room_natural_light)) {
    details.room_natural_light = value.room_natural_light as RoomListingDetails['room_natural_light'];
  }

  if (Array.isArray(value.room_furniture)) {
    const roomFurniture = value.room_furniture.filter((item): item is (typeof roomFurnitureOptions)[number]['value'] => {
      return typeof item === 'string' && roomFurnitureValues.has(item);
    });

    if (roomFurniture.length > 0) {
      details.room_furniture = roomFurniture;
    }
  }

  if (typeof value.room_lock === 'string' && roomLockValues.has(value.room_lock)) {
    details.room_lock = value.room_lock as RoomListingDetails['room_lock'];
  }

  if (typeof value.room_bathroom === 'string' && roomBathroomValues.has(value.room_bathroom)) {
    details.room_bathroom = value.room_bathroom as RoomListingDetails['room_bathroom'];
  }

  if (typeof value.room_furnishing_status === 'string' && roomFurnishingStatusValues.has(value.room_furnishing_status)) {
    details.room_furnishing_status = value.room_furnishing_status as RoomListingDetails['room_furnishing_status'];
  }

  if (typeof value.nearest_transport === 'string' && value.nearest_transport.trim() !== '') {
    details.nearest_transport = value.nearest_transport.trim();
  }

  if (typeof value.transport_walk_minutes === 'number' && Number.isFinite(value.transport_walk_minutes)) {
    details.transport_walk_minutes = value.transport_walk_minutes;
  }

  if (Array.isArray(value.nearby_services)) {
    const nearbyServices = value.nearby_services.filter((item): item is (typeof nearbyServiceOptions)[number]['value'] => {
      return typeof item === 'string' && nearbyServiceValues.has(item);
    });

    if (nearbyServices.length > 0) {
      details.nearby_services = nearbyServices;
    }
  }

  if (typeof value.location_notes === 'string' && value.location_notes.trim() !== '') {
    details.location_notes = value.location_notes.trim();
  }

  return details;
};

export const roomListingDetailsFormFromDetails = (value: Json | null | undefined): RoomListingDetailsForm => {
  const details = normalizeRoomListingDetails(value);

  return {
    neighborhood: details.neighborhood ?? '',
    addressHint: details.address_hint ?? '',
    preferredAgeMin: details.preferred_age_min?.toString() ?? '',
    preferredAgeMax: details.preferred_age_max?.toString() ?? '',
    preferredGender: details.preferred_gender ?? '',
    expensesEstimateMonthly: details.expenses_estimate_monthly?.toString() ?? '',
    depositMonths: details.deposit_months ?? '',
    contractAvailable: details.contract_available ?? '',
    registrationAllowed: details.registration_allowed ?? '',
    noticePeriod: details.notice_period ?? '',
    visitsPolicy: details.visits_policy ?? '',
    partyPolicy: details.party_policy ?? '',
    occupancyPolicy: details.occupancy_policy ?? '',
    allowsMinors: getBooleanFormValue(details.allows_minors),
    currentHouseholdCount: details.current_household_count?.toString() ?? '',
    ownerLivesHere: getBooleanFormValue(details.owner_lives_here),
    homeEnvironment: details.home_environment ?? '',
    cleaningPolicy: details.cleaning_policy ?? '',
    quietHoursPolicy: details.quiet_hours_policy ?? '',
    remoteWorkPolicy: details.remote_work_policy ?? '',
    kitchenUsePolicy: details.kitchen_use_policy ?? '',
    livingRoomUsePolicy: details.living_room_use_policy ?? '',
    bathroomUsePolicy: details.bathroom_use_policy ?? '',
    householdGenderMix: details.household_gender_mix ?? '',
    householdAgeMin: details.household_age_min?.toString() ?? '',
    householdAgeMax: details.household_age_max?.toString() ?? '',
    householdOccupation: details.household_occupation ?? '',
    homeSizeSqm: details.home_size_sqm?.toString() ?? '',
    homeFloor: details.home_floor ?? '',
    homeOrientation: details.home_orientation ?? '',
    hasElevator: getBooleanFormValue(details.has_elevator),
    bedroomCount: details.bedroom_count?.toString() ?? '',
    bathroomCount: details.bathroom_count?.toString() ?? '',
    hasInternet: getBooleanFormValue(details.has_internet),
    equippedKitchen: getBooleanFormValue(details.equipped_kitchen),
    kitchenEquipment: details.kitchen_equipment ?? [],
    washingMachine: getBooleanFormValue(details.washing_machine),
    roomSizeSqm: details.room_size_sqm?.toString() ?? '',
    roomWindow: details.room_window ?? '',
    roomOrientation: details.room_orientation ?? '',
    roomNaturalLight: details.room_natural_light ?? '',
    roomFurniture: details.room_furniture ?? [],
    roomLock: details.room_lock ?? '',
    roomBathroom: details.room_bathroom ?? '',
    roomFurnishingStatus: details.room_furnishing_status ?? '',
    nearestTransport: details.nearest_transport ?? '',
    transportWalkMinutes: details.transport_walk_minutes?.toString() ?? '',
    nearbyServices: details.nearby_services ?? [],
    locationNotes: details.location_notes ?? '',
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

  const addressHint = form.addressHint.trim();
  if (addressHint) {
    details.address_hint = addressHint;
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

  if (depositMonthsValues.has(form.depositMonths)) {
    details.deposit_months = form.depositMonths as RoomListingDetails['deposit_months'];
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

  if (partyPolicyValues.has(form.partyPolicy)) {
    details.party_policy = form.partyPolicy as RoomListingDetails['party_policy'];
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

  if (cleaningPolicyValues.has(form.cleaningPolicy)) {
    details.cleaning_policy = form.cleaningPolicy as RoomListingDetails['cleaning_policy'];
  }

  if (quietHoursPolicyValues.has(form.quietHoursPolicy)) {
    details.quiet_hours_policy = form.quietHoursPolicy as RoomListingDetails['quiet_hours_policy'];
  }

  if (remoteWorkPolicyValues.has(form.remoteWorkPolicy)) {
    details.remote_work_policy = form.remoteWorkPolicy as RoomListingDetails['remote_work_policy'];
  }

  if (kitchenUsePolicyValues.has(form.kitchenUsePolicy)) {
    details.kitchen_use_policy = form.kitchenUsePolicy as RoomListingDetails['kitchen_use_policy'];
  }

  if (livingRoomUsePolicyValues.has(form.livingRoomUsePolicy)) {
    details.living_room_use_policy = form.livingRoomUsePolicy as RoomListingDetails['living_room_use_policy'];
  }

  if (bathroomUsePolicyValues.has(form.bathroomUsePolicy)) {
    details.bathroom_use_policy = form.bathroomUsePolicy as RoomListingDetails['bathroom_use_policy'];
  }

  if (householdGenderMixValues.has(form.householdGenderMix)) {
    details.household_gender_mix = form.householdGenderMix as RoomListingDetails['household_gender_mix'];
  }

  const householdAgeMin = form.householdAgeMin.trim();
  if (householdAgeMin !== '') {
    details.household_age_min = Number(householdAgeMin);
  }

  const householdAgeMax = form.householdAgeMax.trim();
  if (householdAgeMax !== '') {
    details.household_age_max = Number(householdAgeMax);
  }

  if (householdOccupationValues.has(form.householdOccupation)) {
    details.household_occupation = form.householdOccupation as RoomListingDetails['household_occupation'];
  }

  const homeSizeSqm = form.homeSizeSqm.trim();
  if (homeSizeSqm !== '') {
    details.home_size_sqm = Number(homeSizeSqm);
  }

  if (homeFloorValues.has(form.homeFloor)) {
    details.home_floor = form.homeFloor as RoomListingDetails['home_floor'];
  }

  if (homeOrientationValues.has(form.homeOrientation)) {
    details.home_orientation = form.homeOrientation as RoomListingDetails['home_orientation'];
  }

  const hasElevator = parseBooleanField(form.hasElevator);
  if (typeof hasElevator === 'boolean') {
    details.has_elevator = hasElevator;
  }

  const bedroomCount = form.bedroomCount.trim();
  if (bedroomCount !== '') {
    details.bedroom_count = Number(bedroomCount);
  }

  const bathroomCount = form.bathroomCount.trim();
  if (bathroomCount !== '') {
    details.bathroom_count = Number(bathroomCount);
  }

  const hasInternet = parseBooleanField(form.hasInternet);
  if (typeof hasInternet === 'boolean') {
    details.has_internet = hasInternet;
  }

  const equippedKitchen = parseBooleanField(form.equippedKitchen);
  const kitchenEquipment = form.kitchenEquipment.filter((item): item is (typeof kitchenEquipmentOptions)[number]['value'] => {
    return kitchenEquipmentValues.has(item);
  });
  if (kitchenEquipment.length > 0) {
    details.kitchen_equipment = kitchenEquipment;
    details.equipped_kitchen = true;
  } else if (typeof equippedKitchen === 'boolean') {
    details.equipped_kitchen = equippedKitchen;
  }

  const washingMachine = parseBooleanField(form.washingMachine);
  if (typeof washingMachine === 'boolean') {
    details.washing_machine = washingMachine;
  }

  const roomSizeSqm = form.roomSizeSqm.trim();
  if (roomSizeSqm !== '') {
    details.room_size_sqm = Number(roomSizeSqm);
  }

  if (roomWindowValues.has(form.roomWindow)) {
    details.room_window = form.roomWindow as RoomListingDetails['room_window'];
  }

  if (roomOrientationValues.has(form.roomOrientation)) {
    details.room_orientation = form.roomOrientation as RoomListingDetails['room_orientation'];
  }

  if (roomNaturalLightValues.has(form.roomNaturalLight)) {
    details.room_natural_light = form.roomNaturalLight as RoomListingDetails['room_natural_light'];
  }

  const roomFurniture = form.roomFurniture.filter((item): item is (typeof roomFurnitureOptions)[number]['value'] => {
    return roomFurnitureValues.has(item);
  });
  if (roomFurniture.length > 0) {
    details.room_furniture = roomFurniture;
  }

  if (roomLockValues.has(form.roomLock)) {
    details.room_lock = form.roomLock as RoomListingDetails['room_lock'];
  }

  if (roomBathroomValues.has(form.roomBathroom)) {
    details.room_bathroom = form.roomBathroom as RoomListingDetails['room_bathroom'];
  }

  if (roomFurnishingStatusValues.has(form.roomFurnishingStatus)) {
    details.room_furnishing_status = form.roomFurnishingStatus as RoomListingDetails['room_furnishing_status'];
  }

  const nearestTransport = form.nearestTransport.trim();
  if (nearestTransport) {
    details.nearest_transport = nearestTransport;
  }

  const transportWalkMinutes = form.transportWalkMinutes.trim();
  if (transportWalkMinutes !== '') {
    details.transport_walk_minutes = Number(transportWalkMinutes);
  }

  const nearbyServices = form.nearbyServices.filter((item): item is (typeof nearbyServiceOptions)[number]['value'] => {
    return nearbyServiceValues.has(item);
  });
  if (nearbyServices.length > 0) {
    details.nearby_services = nearbyServices;
  }

  const locationNotes = form.locationNotes.trim();
  if (locationNotes) {
    details.location_notes = locationNotes;
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

  if (details.party_policy) {
    const label = partyPolicyOptions.find((option) => option.value === details.party_policy)?.label;
    if (label) {
      items.push({ label: 'Fiestas', value: label });
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

  if (details.household_gender_mix) {
    const label = householdGenderMixOptions.find((option) => option.value === details.household_gender_mix)?.label;
    if (label) {
      items.push({ label: 'Género de tus compañeros/as', value: label });
    }
  }

  if (typeof details.household_age_min === 'number' && typeof details.household_age_max === 'number') {
    items.push({ label: 'Edad aproximada', value: `Entre ${details.household_age_min} y ${details.household_age_max} años` });
  }

  if (details.household_occupation) {
    const label = householdOccupationOptions.find((option) => option.value === details.household_occupation)?.label;
    if (label) {
      items.push({ label: 'Ocupación principal', value: label });
    }
  }

  if (details.home_environment) {
    const label = homeEnvironmentOptions.find((option) => option.value === details.home_environment)?.label;
    if (label) {
      items.push({ label: 'Ambiente del piso', value: label });
    }
  }

  if (details.cleaning_policy) {
    const label = cleaningPolicyOptions.find((option) => option.value === details.cleaning_policy)?.label;
    if (label) {
      items.push({ label: 'Limpieza', value: label });
    }
  }

  if (details.quiet_hours_policy) {
    const label = quietHoursPolicyOptions.find((option) => option.value === details.quiet_hours_policy)?.label;
    if (label) {
      items.push({ label: 'Descanso y ruido', value: label });
    }
  }

  if (details.remote_work_policy) {
    const label = remoteWorkPolicyOptions.find((option) => option.value === details.remote_work_policy)?.label;
    if (label) {
      items.push({ label: 'Teletrabajo', value: label });
    }
  }

  if (details.kitchen_use_policy) {
    const label = kitchenUsePolicyOptions.find((option) => option.value === details.kitchen_use_policy)?.label;
    if (label) {
      items.push({ label: 'Uso de cocina', value: label });
    }
  }

  if (details.living_room_use_policy) {
    const label = livingRoomUsePolicyOptions.find((option) => option.value === details.living_room_use_policy)?.label;
    if (label) {
      items.push({ label: 'Uso de salón', value: label });
    }
  }

  if (details.bathroom_use_policy) {
    const label = bathroomUsePolicyOptions.find((option) => option.value === details.bathroom_use_policy)?.label;
    if (label) {
      items.push({ label: 'Uso de baño', value: label });
    }
  }

  return items;
};

export const getRoomListingHousingItems = (details: RoomListingDetails) => {
  const items: Array<{ label: string; value: string }> = [];

  if (typeof details.home_size_sqm === 'number') {
    items.push({ label: 'Tamaño de la vivienda', value: `${details.home_size_sqm} m²` });
  }

  if (details.home_floor) {
    const label = homeFloorOptions.find((option) => option.value === details.home_floor)?.label;
    if (label) {
      items.push({ label: 'Planta', value: label });
    }
  }

  if (details.home_orientation) {
    const label = homeOrientationOptions.find((option) => option.value === details.home_orientation)?.label;
    if (label) {
      items.push({ label: 'Orientación', value: label });
    }
  }

  if (typeof details.has_elevator === 'boolean') {
    items.push({ label: 'Ascensor', value: details.has_elevator ? 'Sí' : 'No' });
  }

  if (typeof details.bedroom_count === 'number') {
    items.push({
      label: 'Habitaciones',
      value: details.bedroom_count === 1 ? '1 habitación' : `${details.bedroom_count} habitaciones`,
    });
  }

  if (typeof details.bathroom_count === 'number') {
    items.push({
      label: 'Baños',
      value: details.bathroom_count === 1 ? '1 baño' : `${details.bathroom_count} baños`,
    });
  }

  if (typeof details.has_internet === 'boolean') {
    items.push({ label: 'Internet', value: details.has_internet ? 'Sí' : 'No' });
  }

  if (details.kitchen_equipment && details.kitchen_equipment.length > 0) {
    const labels = details.kitchen_equipment
      .map((item) => kitchenEquipmentOptions.find((option) => option.value === item)?.label)
      .filter((label): label is string => Boolean(label));

    if (labels.length > 0) {
      items.push({ label: 'Equipamiento de cocina', value: labels.join(', ') });
    }
  } else if (typeof details.equipped_kitchen === 'boolean') {
    items.push({ label: 'Cocina equipada', value: details.equipped_kitchen ? 'Sí' : 'No' });
  }

  if (typeof details.washing_machine === 'boolean') {
    items.push({ label: 'Lavadora', value: details.washing_machine ? 'Sí' : 'No' });
  }

  return items;
};

export const getRoomListingBedroomItems = (details: RoomListingDetails) => {
  const items: Array<{ label: string; value: string }> = [];

  if (typeof details.room_size_sqm === 'number') {
    items.push({ label: 'Tamaño de la habitación', value: `${details.room_size_sqm} m²` });
  }

  if (details.room_window) {
    const label = roomWindowOptions.find((option) => option.value === details.room_window)?.label;
    if (label) {
      items.push({ label: 'Ventana / salida exterior', value: label });
    }
  }

  if (details.room_orientation) {
    const label = roomOrientationOptions.find((option) => option.value === details.room_orientation)?.label;
    if (label) {
      items.push({ label: 'Orientación de la habitación', value: label });
    }
  }

  if (details.room_natural_light) {
    const label = roomNaturalLightOptions.find((option) => option.value === details.room_natural_light)?.label;
    if (label) {
      items.push({ label: 'Luz natural', value: label });
    }
  }

  if (details.room_furniture && details.room_furniture.length > 0) {
    const labels = details.room_furniture
      .map((item) => roomFurnitureOptions.find((option) => option.value === item)?.label)
      .filter((label): label is string => Boolean(label));

    if (labels.length > 0) {
      items.push({ label: 'Mobiliario', value: labels.join(', ') });
    }
  }

  if (details.room_lock) {
    const label = roomLockOptions.find((option) => option.value === details.room_lock)?.label;
    if (label) {
      items.push({ label: 'Cerradura', value: label });
    }
  }

  if (details.room_bathroom) {
    const label = roomBathroomOptions.find((option) => option.value === details.room_bathroom)?.label;
    if (label) {
      items.push({ label: 'Baño', value: label });
    }
  }

  if (details.room_furnishing_status) {
    const label = roomFurnishingStatusOptions.find((option) => option.value === details.room_furnishing_status)?.label;
    if (label) {
      items.push({ label: 'Estado', value: label });
    }
  }

  return items;
};

export const getRoomListingLocationItems = (details: RoomListingDetails) => {
  const items: Array<{ label: string; value: string }> = [];

  if (details.nearest_transport) {
    items.push({ label: 'Transporte cercano', value: details.nearest_transport });
  }

  if (typeof details.transport_walk_minutes === 'number') {
    items.push({
      label: 'Tiempo al transporte',
      value: details.transport_walk_minutes === 1 ? '1 minuto andando' : `${details.transport_walk_minutes} minutos andando`,
    });
  }

  if (details.nearby_services && details.nearby_services.length > 0) {
    const labels = details.nearby_services
      .map((item) => nearbyServiceOptions.find((option) => option.value === item)?.label)
      .filter((label): label is string => Boolean(label));

    if (labels.length > 0) {
      items.push({ label: 'Servicios cercanos', value: labels.join(', ') });
    }
  }

  if (details.location_notes) {
    items.push({ label: 'Notas de ubicación', value: details.location_notes });
  }

  return items;
};

export const getRoomListingLocationLabel = (details: RoomListingDetails, city: string | null | undefined) => {
  const parts = [city, details.neighborhood].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(' · ') : 'Ciudad no indicada';
};

export const getRoomListingCardHighlights = (
  details: RoomListingDetails,
  options: {
    billsIncluded?: boolean | null;
    maxItems?: number;
  } = {},
) => {
  const highlights: string[] = [];
  const add = (value: string | null | undefined) => {
    if (!value || highlights.includes(value)) return;
    highlights.push(value);
  };

  if (typeof details.room_size_sqm === 'number') {
    add(`${details.room_size_sqm} m²`);
  }

  if (details.room_bathroom === 'private') {
    add('Baño propio');
  } else if (details.room_bathroom === 'preferred_use') {
    add('Baño preferente');
  }

  if (details.room_window === 'balcony') {
    add('Balcón');
  } else if (details.room_window === 'terrace') {
    add('Terraza');
  }

  if (details.nearest_transport || details.nearby_services?.some((service) => ['metro', 'bus', 'train'].includes(service))) {
    add('Transporte cerca');
  }

  if (options.billsIncluded) {
    add('Gastos incluidos');
  }

  if (details.contract_available === 'yes') {
    add('Contrato');
  }

  if (details.has_elevator) {
    add('Ascensor');
  }

  if (details.has_internet) {
    add('Internet');
  }

  if (details.room_lock === 'yes') {
    add('Cerradura');
  }

  return highlights.slice(0, options.maxItems ?? 5);
};

export const getRoomListingMoneyItems = (details: RoomListingDetails) => {
  const items: Array<{ label: string; value: string }> = [];

  if (typeof details.expenses_estimate_monthly === 'number') {
    items.push({ label: 'Gastos estimados', value: `${details.expenses_estimate_monthly}€/mes` });
  }

  if (details.deposit_months) {
    const label = depositMonthsOptions.find((option) => option.value === details.deposit_months)?.label;
    if (label) {
      items.push({ label: 'Fianza', value: label });
    }
  } else if (typeof details.deposit_amount === 'number') {
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
