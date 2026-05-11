import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Loader2, Upload, Users, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { buildRoomListingDetailsFromForm, contractAvailableOptions, emptyRoomListingDetailsForm, homeEnvironmentOptions, noticePeriodOptions, occupancyPolicyOptions, preferredGenderOptions, registrationAllowedOptions, visitsPolicyOptions, type RoomListingDetailsForm } from '@/lib/listingDetails';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

const cities = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao',
  'Zaragoza', 'Málaga', 'Granada', 'San Sebastián', 'Alicante',
  'A Coruña', 'Palma de Mallorca'
];

const listingTypes = [
  { value: 'offer_room', rpcType: 'room', label: 'Ofrezco habitación', icon: Home, description: 'Tengo una habitación disponible' },
  { value: 'seek_flatmate', rpcType: 'flatmate', label: 'Busco compañero/a', icon: Users, description: 'Busco compañero/a para alquilar juntos' },
] as const;

type ListingKind = typeof listingTypes[number]['value'];

const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 1200;
const NEIGHBORHOOD_MAX_LENGTH = 80;
const AGE_RANGE_MIN = 18;
const AGE_RANGE_MAX = 75;

type FormData = {
  type: ListingKind | '';
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  price: string;
  expensesIncluded: boolean;
  availableDate: string;
  minStay: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  roomDetails: RoomListingDetailsForm;
};

type CreateListingResponse = {
  ok: boolean;
  code?: string;
  listing_id?: string;
};

const getCreateErrorMessage = (code?: string) => {
  if (code === 'NOT_AUTHENTICATED') return 'Inicia sesión para publicar anuncios.';
  if (code === 'TITLE_REQUIRED') return 'El título es obligatorio.';
  if (code === 'TITLE_TOO_SHORT') return 'El título debe tener al menos 10 caracteres.';
  if (code === 'DESCRIPTION_TOO_SHORT') return 'La descripción debe tener al menos 20 caracteres.';
  if (code === 'INVALID_LISTING_TYPE') return 'Tipo de anuncio no válido.';
  return 'No se pudo crear el anuncio.';
};

const sanitizeFileName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');

export default function CreateListing() {
  useSEO({ page: 'createListing', noIndex: true });

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({
    type: '',
    title: '',
    description: '',
    city: '',
    neighborhood: '',
    price: '',
    expensesIncluded: false,
    availableDate: '',
    minStay: '6',
    smokingAllowed: false,
    petsAllowed: false,
    roomDetails: emptyRoomListingDetailsForm(),
  });

  const selectedType = listingTypes.find((type) => type.value === formData.type);
  const isFlatmateListing = selectedType?.rpcType === 'flatmate';

  const previews = useMemo(() => photoFiles.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  })), [photoFiles]);

  useEffect(() => () => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  const handleTypeSelect = (type: ListingKind) => {
    setFormData({
      ...formData,
      type,
      roomDetails: {
        ...formData.roomDetails,
        neighborhood: formData.neighborhood,
      },
    });
    setStep(2);
  };

  const handlePhotosSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    const validFiles = imageFiles.filter((file) => file.size <= 5 * 1024 * 1024);
    const availableSlots = Math.max(0, 8 - photoFiles.length);

    if (validFiles.length !== files.length) {
      toast.warning('Algunas fotos se han omitido: solo imágenes de hasta 5MB.');
    }

    if (validFiles.length > availableSlots) {
      toast.warning('Puedes subir un máximo de 8 fotos por anuncio.');
    }

    setPhotoFiles((current) => [...current, ...validFiles.slice(0, availableSlots)]);
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const validateStepTwo = () => {
    const title = formData.title.trim();
    const description = formData.description.trim();
    const neighborhood = formData.neighborhood.trim();

    if (title.length < TITLE_MIN_LENGTH) {
      toast.error(`El título debe tener al menos ${TITLE_MIN_LENGTH} caracteres`);
      return false;
    }
    if (title.length > TITLE_MAX_LENGTH) {
      toast.error(`El título no puede superar ${TITLE_MAX_LENGTH} caracteres`);
      return false;
    }
    if (description.length < DESCRIPTION_MIN_LENGTH) {
      toast.error(`La descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres`);
      return false;
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      toast.error(`La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres`);
      return false;
    }
    if (neighborhood.length > NEIGHBORHOOD_MAX_LENGTH) {
      toast.error(`El barrio o zona no puede superar ${NEIGHBORHOOD_MAX_LENGTH} caracteres`);
      return false;
    }
    if (!formData.city) {
      toast.error('Selecciona una ciudad');
      return false;
    }
    return true;
  };

  const booleanSelectValue = (value: boolean) => (value ? 'yes' : 'no');
  const parseBooleanSelectValue = (value: string) => value === 'yes';
  const preferredAgeRange = [
    Number(formData.roomDetails.preferredAgeMin) || AGE_RANGE_MIN,
    Number(formData.roomDetails.preferredAgeMax) || AGE_RANGE_MAX,
  ];

  const validateDetails = () => {
    if (formData.price) {
      const price = Number(formData.price);
      if (!Number.isFinite(price) || price < 0) {
        toast.error('Introduce un precio válido');
        return false;
      }
      if (price > 10000) {
        toast.error('El precio mensual parece demasiado alto');
        return false;
      }
    }

    if (formData.availableDate) {
      const selectedDate = new Date(`${formData.availableDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.error('La fecha disponible no puede estar en el pasado');
        return false;
      }
    }

    const currentHouseholdCount = formData.roomDetails.currentHouseholdCount.trim();
    if (currentHouseholdCount) {
      const count = Number(currentHouseholdCount);
      if (!Number.isInteger(count) || count < 0) {
        toast.error('Indica un número válido de personas viviendo actualmente');
        return false;
      }
    }

    return true;
  };

  const uploadPhotos = async (userId: string) => {
    const uploadedUrls: string[] = [];

    for (const [index, file] of photoFiles.entries()) {
      const path = `${userId}/${Date.now()}-${index}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!selectedType || !validateStepTwo() || !validateDetails()) return;

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        toast.error('Inicia sesión para publicar anuncios');
        navigate('/login');
        return;
      }

      const photos = await uploadPhotos(user.id);
      const details = selectedType.rpcType === 'room'
        ? buildRoomListingDetailsFromForm({
            ...formData.roomDetails,
            neighborhood: formData.neighborhood,
          })
        : {};

      const { data, error } = await supabase.rpc('convinter_create_listing', {
        p_listing_type: selectedType.rpcType,
        p_title: formData.title.trim(),
        p_description: formData.description.trim(),
        p_city: formData.city,
        p_province_code: null,
        p_price_monthly: formData.price ? Number(formData.price) : null,
        p_bills_included: formData.expensesIncluded,
        p_available_from: formData.availableDate || null,
        p_min_stay_months: formData.minStay ? Number(formData.minStay) : null,
        p_smoking_allowed: formData.smokingAllowed,
        p_pets_allowed: formData.petsAllowed,
        p_photos: photos.length > 0 ? photos : null,
        p_details: details,
      });

      if (error) throw error;

      const result = data as unknown as CreateListingResponse;
      if (!result.ok || !result.listing_id) {
        toast.error(getCreateErrorMessage(result.code));
        return;
      }

      toast.success('Anuncio creado correctamente', {
        description: 'Tu anuncio ya está visible para otros usuarios.',
      });
      navigate(`/listing/${result.listing_id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('No se pudo crear el anuncio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/listings')}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step > 1 ? 'Anterior' : 'Volver a anuncios'}
        </Button>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((currentStep) => (
            <div
              key={currentStep}
              className={`h-2 flex-1 rounded-full transition-colors ${currentStep <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Crear anuncio</h1>
            <p className="text-muted-foreground mb-8">¿Qué tipo de anuncio quieres publicar?</p>

            <div className="grid gap-4">
              {listingTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${formData.type === type.value ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <type.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Información básica</h1>
            <p className="text-muted-foreground mb-8">{isFlatmateListing ? 'Cuéntanos qué tipo de compañero/a buscas para alquilar juntos' : 'Cuéntanos más sobre tu habitación disponible'}</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del anuncio</Label>
                <Input
                  id="title"
                  placeholder={isFlatmateListing ? 'Ej: Busco compañero/a tranquilo/a para alquilar juntos en Madrid' : 'Ej: Habitación luminosa en el centro'}
                  value={formData.title}
                  maxLength={TITLE_MAX_LENGTH}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.title.length}/{TITLE_MAX_LENGTH}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder={isFlatmateListing ? 'Describe qué tipo de convivencia buscas, presupuesto, zonas y tiempos para alquilar juntos...' : 'Describe el espacio, el ambiente del piso y qué buscas en la convivencia...'}
                  rows={5}
                  value={formData.description}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Barrio o zona</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Ej: Malasaña"
                    value={formData.neighborhood}
                    maxLength={NEIGHBORHOOD_MAX_LENGTH}
                    onChange={(event) => setFormData({ ...formData, neighborhood: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.neighborhood.length}/{NEIGHBORHOOD_MAX_LENGTH}
                  </p>
                </div>
              </div>

              <Button className="w-full" onClick={() => validateStepTwo() && setStep(3)}>
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Detalles y fotos</h1>
            <p className="text-muted-foreground mb-8">Añade los últimos detalles</p>

            <div className="space-y-6">
              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Buscando</h2>
                    <p className="text-sm text-muted-foreground">Define qué persona encaja mejor con esta habitación.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-4 sm:col-span-2">
                      <div className="flex items-center justify-between gap-4">
                        <Label>Edad preferida</Label>
                        <span className="text-sm font-medium">
                          {preferredAgeRange[0]} - {preferredAgeRange[1]} años
                        </span>
                      </div>
                      <Slider
                        min={AGE_RANGE_MIN}
                        max={AGE_RANGE_MAX}
                        step={1}
                        value={preferredAgeRange}
                        onValueChange={([min, max]) => setFormData({
                          ...formData,
                          roomDetails: {
                            ...formData.roomDetails,
                            preferredAgeMin: String(min),
                            preferredAgeMax: String(max),
                          },
                        })}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{AGE_RANGE_MIN} años</span>
                        <span>{AGE_RANGE_MAX} años</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Género preferido</Label>
                      <Select
                        value={formData.roomDetails.preferredGender}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, preferredGender: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {preferredGenderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableDate">Disponible desde</Label>
                      <Input
                        id="availableDate"
                        type="date"
                        value={formData.availableDate}
                        onChange={(event) => setFormData({ ...formData, availableDate: event.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minStay">Estancia mínima</Label>
                      <Select value={formData.minStay} onValueChange={(value) => setFormData({ ...formData, minStay: value })}>
                        <SelectTrigger id="minStay">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 mes</SelectItem>
                          <SelectItem value="3">3 meses</SelectItem>
                          <SelectItem value="6">6 meses</SelectItem>
                          <SelectItem value="12">12 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Disponible para</Label>
                      <Select
                        value={formData.roomDetails.occupancyPolicy}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, occupancyPolicy: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupancyPolicyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Acepta menores</Label>
                      <Select
                        value={formData.roomDetails.allowsMinors}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, allowsMinors: value as RoomListingDetailsForm['allowsMinors'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <h2 className="font-semibold">Precio y gastos</h2>
                  <p className="text-sm text-muted-foreground">Define el coste principal del anuncio.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio mensual (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      placeholder="450"
                      value={formData.price}
                      onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gastos incluidos</Label>
                    <Select
                      value={booleanSelectValue(formData.expensesIncluded)}
                      onValueChange={(value) => setFormData({ ...formData, expensesIncluded: parseBooleanSelectValue(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Agua, luz, internet...</p>
                  </div>

                  {!isFlatmateListing && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="expensesEstimateMonthly">Gastos estimados mensuales (€)</Label>
                        <Input
                          id="expensesEstimateMonthly"
                          type="number"
                          min="0"
                          placeholder="Ej: 50"
                          value={formData.roomDetails.expensesEstimateMonthly}
                          onChange={(event) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, expensesEstimateMonthly: event.target.value },
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="depositAmount">Fianza (€)</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          min="0"
                          placeholder="Ej: 450"
                          value={formData.roomDetails.depositAmount}
                          onChange={(event) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, depositAmount: event.target.value },
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Contrato</Label>
                        <Select
                          value={formData.roomDetails.contractAvailable}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, contractAvailable: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {contractAvailableOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Empadronamiento</Label>
                        <Select
                          value={formData.roomDetails.registrationAllowed}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, registrationAllowed: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {registrationAllowedOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Preaviso para dejar la habitación</Label>
                        <Select
                          value={formData.roomDetails.noticePeriod}
                          onValueChange={(value) => setFormData({
                            ...formData,
                            roomDetails: { ...formData.roomDetails, noticePeriod: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una opción" />
                          </SelectTrigger>
                          <SelectContent>
                            {noticePeriodOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {isFlatmateListing && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="availableDate">Disponible desde</Label>
                        <Input
                          id="availableDate"
                          type="date"
                          value={formData.availableDate}
                          onChange={(event) => setFormData({ ...formData, availableDate: event.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minStay">Estancia mínima</Label>
                        <Select value={formData.minStay} onValueChange={(value) => setFormData({ ...formData, minStay: value })}>
                          <SelectTrigger id="minStay">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 mes</SelectItem>
                            <SelectItem value="3">3 meses</SelectItem>
                            <SelectItem value="6">6 meses</SelectItem>
                            <SelectItem value="12">12 meses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!isFlatmateListing && (
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="font-semibold">Condiciones de convivencia</h2>
                    <p className="text-sm text-muted-foreground">Estos detalles describen las normas concretas de esta habitación anunciada.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Política de visitas</Label>
                      <Select
                        value={formData.roomDetails.visitsPolicy}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, visitsPolicy: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {visitsPolicyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Permite fumar</Label>
                      <Select
                        value={booleanSelectValue(formData.smokingAllowed)}
                        onValueChange={(value) => setFormData({ ...formData, smokingAllowed: parseBooleanSelectValue(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Permite mascotas</Label>
                      <Select
                        value={booleanSelectValue(formData.petsAllowed)}
                        onValueChange={(value) => setFormData({ ...formData, petsAllowed: parseBooleanSelectValue(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ambiente del piso</Label>
                      <Select
                        value={formData.roomDetails.homeEnvironment}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, homeEnvironment: value },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {homeEnvironmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Propietario vive en la vivienda</Label>
                      <Select
                        value={formData.roomDetails.ownerLivesHere}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          roomDetails: { ...formData.roomDetails, ownerLivesHere: value as RoomListingDetailsForm['ownerLivesHere'] },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sí</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentHouseholdCount">Personas viviendo actualmente</Label>
                    <Input
                      id="currentHouseholdCount"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 2"
                      value={formData.roomDetails.currentHouseholdCount}
                      onChange={(event) => setFormData({
                        ...formData,
                        roomDetails: { ...formData.roomDetails, currentHouseholdCount: event.target.value },
                      })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <h2 className="font-semibold">Fotos del anuncio</h2>
                  <p className="text-sm text-muted-foreground">Añade imágenes claras para que otros usuarios entiendan mejor el espacio.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotosSelected}
                />
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || photoFiles.length >= 8}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Selecciona hasta 8 fotos JPG, PNG o WebP</p>
                  <p className="mt-1 text-xs text-muted-foreground">{photoFiles.length}/8 fotos seleccionadas</p>
                </button>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {previews.map(({ file, url }, index) => (
                      <div key={`${file.name}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                        <img src={url} alt={file.name} className="h-full w-full object-cover" />
                        {index === 0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
                            Portada
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7"
                          onClick={() => removePhoto(index)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar anuncio
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}


