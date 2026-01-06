import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, Euro, Home, Users, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const mockListings = [
  {
    id: '1',
    type: 'offering_room',
    title: 'Habitación luminosa en Malasaña',
    photos: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    city: 'Madrid',
    neighborhood: 'Malasaña',
    price: 450,
    billsIncluded: true,
    deposit: 450,
    availableFrom: '2026-02-01',
    minStay: 6,
    furnished: true,
    description: 'Habitación amplia y luminosa en el corazón de Malasaña. El piso está completamente reformado y cuenta con calefacción central. La habitación tiene armario empotrado y ventana grande.',
    ambiance: 'balanced',
    householdProfile: { residents: 2, ages: '25-32', telecommute: true, routine: 'Teletrabajo la mayoría de días. Noches tranquilas.' },
    rules: ['No fumar', 'Sin mascotas', 'Visitas con aviso'],
    tags: ['WiFi', 'Calefacción', 'Reformado'],
    owner: { name: 'Laura P.', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', verified: true, testCompleted: true },
    compatibility: { score: 87, reasons: ['Horarios similares', 'Mismo nivel de limpieza'], friction: 'Diferentes preferencias de temperatura' },
  },
  {
    id: '2',
    type: 'offering_room',
    title: 'Piso compartido cerca de Gran Vía',
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    city: 'Madrid',
    neighborhood: 'Centro',
    price: 520,
    billsIncluded: false,
    deposit: 520,
    availableFrom: '2026-01-15',
    minStay: 3,
    furnished: true,
    description: 'Habitación en piso céntrico a 5 minutos de Gran Vía. Ideal para estudiantes o jóvenes profesionales. Ambiente social y dinámico.',
    ambiance: 'social',
    householdProfile: { residents: 3, ages: '22-28', telecommute: false, routine: 'Trabajamos fuera. Fines de semana animados.' },
    rules: ['No fumar dentro', 'Mascotas pequeñas OK', 'Fiestas con aviso'],
    tags: ['Céntrico', 'Social', 'Joven'],
    owner: { name: 'Miguel A.', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', verified: true, testCompleted: true },
    compatibility: { score: 75, reasons: ['Misma zona', 'Edades similares'], friction: 'Él es más social' },
  },
  {
    id: '3',
    type: 'offering_room',
    title: 'Habitación en Chamberí con terraza',
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
    city: 'Madrid',
    neighborhood: 'Chamberí',
    price: 580,
    billsIncluded: true,
    deposit: 580,
    availableFrom: '2026-02-15',
    minStay: 12,
    furnished: true,
    description: 'Elegante habitación en Chamberí con acceso a terraza comunitaria. Barrio tranquilo con todos los servicios. Ideal para profesionales.',
    ambiance: 'quiet',
    householdProfile: { residents: 1, ages: '35', telecommute: true, routine: 'Trabajo desde casa. Muy tranquilo.' },
    rules: ['No fumar', 'Sin mascotas', 'Silencio después de 22h'],
    tags: ['Terraza', 'Profesional', 'Tranquilo'],
    owner: { name: 'Carmen R.', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', verified: true, testCompleted: true },
    compatibility: { score: 92, reasons: ['Ambos teletrabajan', 'Mismo nivel de orden'], friction: 'Ella prefiere más silencio' },
  },
  {
    id: '4',
    type: 'seeking_room',
    title: 'Busco habitación en Lavapiés',
    photos: ['https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800'],
    city: 'Madrid',
    neighborhood: 'Lavapiés',
    price: 400,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-01-20',
    minStay: 0,
    furnished: null,
    description: 'Soy Pablo, artista visual de 28 años. Busco habitación en Lavapiés o alrededores. Trabajo desde casa algunos días. Soy tranquilo pero social.',
    ambiance: 'balanced',
    householdProfile: null,
    rules: null,
    tags: ['Artista', 'Flexible', 'Social'],
    owner: { name: 'Pablo S.', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', verified: true, testCompleted: true },
    compatibility: { score: 80, reasons: ['Creativos ambos', 'Horarios flexibles'], friction: 'Él recibe visitas de modelos para proyectos' },
  },
  {
    id: '5',
    type: 'seeking_room',
    title: 'Busco habitación en Gràcia',
    photos: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'],
    city: 'Barcelona',
    neighborhood: 'Gràcia',
    price: 500,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-02-01',
    minStay: 0,
    furnished: null,
    description: 'Hola, soy Paula, diseñadora gráfica. Busco habitación en un piso tranquilo en Gràcia. Teletrabajo la mayor parte del tiempo. Limpia y ordenada.',
    ambiance: 'quiet',
    householdProfile: null,
    rules: null,
    tags: ['Profesional', 'Tranquila', 'Teletrabajo'],
    owner: { name: 'Paula M.', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', verified: true, testCompleted: true },
    compatibility: { score: 94, reasons: ['Estilo de vida similar', 'Mismas expectativas'], friction: 'Ella prefiere más silencio' },
  },
  {
    id: '6',
    type: 'offering_room',
    title: 'Ático con vistas en Eixample',
    photos: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'],
    city: 'Barcelona',
    neighborhood: 'Eixample',
    price: 650,
    billsIncluded: true,
    deposit: 1300,
    availableFrom: '2026-03-01',
    minStay: 6,
    furnished: true,
    description: 'Espectacular ático en el Eixample con terraza privada y vistas a la Sagrada Familia. Piso de diseño totalmente reformado.',
    ambiance: 'balanced',
    householdProfile: { residents: 1, ages: '32', telecommute: true, routine: 'Trabajo flexible. Cenas tranquilas.' },
    rules: ['No fumar', 'Mascotas negociable', 'Respeto horarios'],
    tags: ['Ático', 'Vistas', 'Premium'],
    owner: { name: 'Jordi V.', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', verified: true, testCompleted: true },
    compatibility: { score: 85, reasons: ['Profesionales ambos', 'Ordenados'], friction: 'Precio alto' },
  },
  {
    id: '7',
    type: 'offering_room',
    title: 'Habitación en El Born',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    city: 'Barcelona',
    neighborhood: 'El Born',
    price: 580,
    billsIncluded: false,
    deposit: 580,
    availableFrom: '2026-01-25',
    minStay: 4,
    furnished: true,
    description: 'Habitación con encanto en el Born, barrio con la mejor vida cultural de Barcelona. Piso histórico reformado con techos altos.',
    ambiance: 'social',
    householdProfile: { residents: 2, ages: '25-30', telecommute: false, routine: 'Vida activa. Salimos mucho.' },
    rules: ['No fumar dentro', 'Mascotas OK', 'Ambiente social'],
    tags: ['Cultural', 'Céntrico', 'Social'],
    owner: { name: 'Marta L.', photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150', verified: false, testCompleted: true },
    compatibility: { score: 78, reasons: ['Edades similares', 'Zona preferida'], friction: 'Mucha vida social' },
  },
  {
    id: '8',
    type: 'offering_room',
    title: 'Piso acogedor en Ruzafa',
    photos: ['https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
    city: 'Valencia',
    neighborhood: 'Ruzafa',
    price: 380,
    billsIncluded: true,
    deposit: 380,
    availableFrom: '2026-02-01',
    minStay: 6,
    furnished: true,
    description: 'Habitación en el barrio más trendy de Valencia. Ruzafa es perfecto para artistas, creativos y amantes de la buena comida.',
    ambiance: 'social',
    householdProfile: { residents: 2, ages: '26-28', telecommute: true, routine: 'Creativos. Noches animadas en el barrio.' },
    rules: ['Fumadores OK terraza', 'Mascotas OK', 'Buena onda'],
    tags: ['Artístico', 'Balcón', 'Trendy'],
    owner: { name: 'Lucía F.', photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150', verified: true, testCompleted: true },
    compatibility: { score: 89, reasons: ['Creativos ambos', 'Les gusta socializar'], friction: 'Puede haber ruido nocturno' },
  },
  {
    id: '9',
    type: 'seeking_room',
    title: 'Busco piso en El Carmen',
    photos: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'],
    city: 'Valencia',
    neighborhood: 'El Carmen',
    price: 350,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-01-15',
    minStay: 3,
    furnished: null,
    description: 'David, 24 años, estudiante de arquitectura. Busco habitación en El Carmen o Ruzafa. Horarios variables por la uni.',
    ambiance: 'balanced',
    householdProfile: null,
    rules: null,
    tags: ['Estudiante', 'Flexible', 'Nocturno'],
    owner: { name: 'David G.', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', verified: true, testCompleted: false },
    compatibility: { score: 72, reasons: ['Edades similares', 'Zona preferida'], friction: 'Horarios de estudiante' },
  },
  {
    id: '10',
    type: 'offering_room',
    title: 'Casa con patio en Triana',
    photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'https://images.unsplash.com/photo-1600607687644-aaca8e4aaca3?w=800'],
    city: 'Sevilla',
    neighborhood: 'Triana',
    price: 320,
    billsIncluded: true,
    deposit: 320,
    availableFrom: '2026-02-10',
    minStay: 6,
    furnished: true,
    description: 'Encantadora casa andaluza en Triana con patio interior. Experiencia auténtica sevillana en el barrio más tradicional.',
    ambiance: 'quiet',
    householdProfile: { residents: 1, ages: '34', telecommute: true, routine: 'Vida tranquila. Trabajo desde casa.' },
    rules: ['No fumar', 'Sin mascotas grandes', 'Respeto'],
    tags: ['Patio', 'Tradicional', 'Tranquilo'],
    owner: { name: 'Rocío M.', photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150', verified: true, testCompleted: true },
    compatibility: { score: 91, reasons: ['Tranquilos ambos', 'Les gusta la cultura'], friction: 'Ella viaja por trabajo' },
  },
  {
    id: '11',
    type: 'offering_room',
    title: 'Habitación en Nervión',
    photos: ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800'],
    city: 'Sevilla',
    neighborhood: 'Nervión',
    price: 350,
    billsIncluded: false,
    deposit: 350,
    availableFrom: '2026-01-20',
    minStay: 4,
    furnished: true,
    description: 'Habitación moderna en Nervión, cerca del estadio y centros comerciales. Bien comunicado con metro y bus.',
    ambiance: 'balanced',
    householdProfile: { residents: 2, ages: '26-29', telecommute: false, routine: 'Trabajamos fuera. Deportistas.' },
    rules: ['No fumar', 'Sin mascotas', 'Orden'],
    tags: ['Metro', 'Deportivo', 'Moderno'],
    owner: { name: 'Antonio J.', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', verified: false, testCompleted: true },
    compatibility: { score: 76, reasons: ['Deportistas ambos', 'Horarios similares'], friction: 'Diferentes niveles de limpieza' },
  },
  {
    id: '12',
    type: 'offering_room',
    title: 'Piso moderno en Casco Viejo',
    photos: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
    city: 'Bilbao',
    neighborhood: 'Casco Viejo',
    price: 420,
    billsIncluded: true,
    deposit: 420,
    availableFrom: '2026-02-01',
    minStay: 6,
    furnished: true,
    description: 'Piso reformado en el corazón del Casco Viejo de Bilbao. A pocos minutos del Guggenheim y la ría.',
    ambiance: 'balanced',
    householdProfile: { residents: 1, ages: '30', telecommute: true, routine: 'Equilibrado. Teletrabajo y ocio.' },
    rules: ['No fumar', 'Mascotas pequeñas OK', 'Respeto mutuo'],
    tags: ['Céntrico', 'Reformado', 'Cultural'],
    owner: { name: 'Iker Z.', photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150', verified: true, testCompleted: true },
    compatibility: { score: 88, reasons: ['Profesionales ambos', 'Les gusta la cultura'], friction: 'Él prefiere temperatura alta' },
  },
  {
    id: '13',
    type: 'seeking_room',
    title: 'Busco habitación en Deusto',
    photos: ['https://images.unsplash.com/photo-1598928506311-c55ez3a3b0e3?w=800'],
    city: 'Bilbao',
    neighborhood: 'Deusto',
    price: 380,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-01-25',
    minStay: 0,
    furnished: null,
    description: 'Amaia, 24 años, estudiante de doctorado en la UPV. Busco habitación tranquila cerca del campus de Deusto.',
    ambiance: 'quiet',
    householdProfile: null,
    rules: null,
    tags: ['Universitaria', 'Tranquila', 'Estudiosa'],
    owner: { name: 'Amaia R.', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', verified: true, testCompleted: true },
    compatibility: { score: 83, reasons: ['Tranquilas ambas', 'Horarios compatibles'], friction: 'Ella estudia de noche' },
  },
  {
    id: '14',
    type: 'offering_room',
    title: 'Habitación amplia en Centro',
    photos: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
    city: 'Zaragoza',
    neighborhood: 'Centro',
    price: 300,
    billsIncluded: true,
    deposit: 300,
    availableFrom: '2026-02-15',
    minStay: 3,
    furnished: true,
    description: 'Habitación grande en pleno centro de Zaragoza. Piso con mucha luz natural y bien comunicado.',
    ambiance: 'balanced',
    householdProfile: { residents: 2, ages: '27-30', telecommute: false, routine: 'Trabajamos fuera. Tranquilo.' },
    rules: ['No fumar', 'Sin mascotas', 'Limpieza compartida'],
    tags: ['Económico', 'Céntrico', 'Luminoso'],
    owner: { name: 'Jorge N.', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', verified: true, testCompleted: true },
    compatibility: { score: 86, reasons: ['Ordenados ambos', 'Horarios compatibles'], friction: 'Diferente tolerancia al ruido' },
  },
  {
    id: '15',
    type: 'offering_room',
    title: 'Piso en Delicias',
    photos: ['https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800'],
    city: 'Zaragoza',
    neighborhood: 'Delicias',
    price: 280,
    billsIncluded: false,
    deposit: 280,
    availableFrom: '2026-01-30',
    minStay: 6,
    furnished: true,
    description: 'Habitación económica en barrio residencial. Ideal para estudiantes o profesionales con presupuesto ajustado.',
    ambiance: 'quiet',
    householdProfile: { residents: 1, ages: '45', telecommute: false, routine: 'Trabajo en oficina. Casa tranquila.' },
    rules: ['No fumar', 'Sin mascotas', 'Sin fiestas'],
    tags: ['Económico', 'Tranquilo', 'Familiar'],
    owner: { name: 'Pilar H.', photo: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150', verified: true, testCompleted: false },
    compatibility: { score: 70, reasons: ['Presupuesto ajustado', 'Tranquilos'], friction: 'Diferencia de edad' },
  },
  {
    id: '16',
    type: 'offering_room',
    title: 'Habitación cerca de la playa',
    photos: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'],
    city: 'Málaga',
    neighborhood: 'El Palo',
    price: 400,
    billsIncluded: true,
    deposit: 400,
    availableFrom: '2026-02-01',
    minStay: 4,
    furnished: true,
    description: 'Habitación luminosa a 5 minutos de la playa en El Palo. Barrio tranquilo con ambiente de pueblo.',
    ambiance: 'quiet',
    householdProfile: { residents: 1, ages: '33', telecommute: true, routine: 'Surf por las mañanas. Teletrabajo.' },
    rules: ['No fumar', 'Mascotas OK', 'Respeto horarios'],
    tags: ['Playa', 'Luminoso', 'Tranquilo'],
    owner: { name: 'Marina C.', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150', verified: true, testCompleted: true },
    compatibility: { score: 90, reasons: ['Deportistas', 'Amantes de la naturaleza'], friction: 'Ella madruga mucho' },
  },
  {
    id: '17',
    type: 'seeking_room',
    title: 'Busco piso en Centro Málaga',
    photos: ['https://images.unsplash.com/photo-1529408686214-b48b8532f72c?w=800'],
    city: 'Málaga',
    neighborhood: 'Centro',
    price: 380,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-01-20',
    minStay: 6,
    furnished: null,
    description: 'Andrés, 31 años, consultor. Busco habitación céntrica en Málaga. Trabajo desde casa varios días.',
    ambiance: 'balanced',
    householdProfile: null,
    rules: null,
    tags: ['Profesional', 'Activo', 'Social'],
    owner: { name: 'Andrés T.', photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150', verified: true, testCompleted: true },
    compatibility: { score: 79, reasons: ['Profesionales ambos', 'Horarios flexibles'], friction: 'Él es más social' },
  },
  {
    id: '18',
    type: 'offering_room',
    title: 'Piso con vistas al mar',
    photos: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'],
    city: 'San Sebastián',
    neighborhood: 'Gros',
    price: 550,
    billsIncluded: true,
    deposit: 1100,
    availableFrom: '2026-03-01',
    minStay: 6,
    furnished: true,
    description: 'Espectacular piso en Gros con vistas a la playa de la Zurriola. Perfecto para amantes del surf y la vida activa.',
    ambiance: 'balanced',
    householdProfile: { residents: 1, ages: '29', telecommute: true, routine: 'Surf, trabajo, pintxos.' },
    rules: ['No fumar', 'Mascotas negociable', 'Surf lovers'],
    tags: ['Vistas mar', 'Surf', 'Premium'],
    owner: { name: 'Leire A.', photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150', verified: true, testCompleted: true },
    compatibility: { score: 93, reasons: ['Deportistas', 'Amantes del mar', 'Profesionales'], friction: 'Precio alto' },
  },
  {
    id: '19',
    type: 'offering_room',
    title: 'Habitación en el Albaicín',
    photos: ['https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
    city: 'Granada',
    neighborhood: 'Albaicín',
    price: 300,
    billsIncluded: true,
    deposit: 300,
    availableFrom: '2026-02-01',
    minStay: 3,
    furnished: true,
    description: 'Casa tradicional en el Albaicín con vistas a la Alhambra. Experiencia única en el barrio más emblemático de Granada.',
    ambiance: 'quiet',
    householdProfile: { residents: 1, ages: '35', telecommute: true, routine: 'Trabajo creativo. Vida contemplativa.' },
    rules: ['No fumar', 'Sin mascotas', 'Respeto al entorno'],
    tags: ['Histórico', 'Vistas Alhambra', 'Bohemio'],
    owner: { name: 'Fernando L.', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', verified: true, testCompleted: true },
    compatibility: { score: 87, reasons: ['Creativos', 'Amantes del arte', 'Tranquilos'], friction: 'Cuestas del barrio' },
  },
  {
    id: '20',
    type: 'seeking_room',
    title: 'Busco habitación cerca del puerto',
    photos: ['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'],
    city: 'Alicante',
    neighborhood: 'Centro',
    price: 350,
    billsIncluded: false,
    deposit: null,
    availableFrom: '2026-01-15',
    minStay: 0,
    furnished: null,
    description: 'Elena, 30 años, ingeniera. Busco habitación cerca del puerto o centro de Alicante. Madrugadora y ordenada.',
    ambiance: 'quiet',
    householdProfile: null,
    rules: null,
    tags: ['Profesional', 'Playa', 'Madrugadora'],
    owner: { name: 'Elena P.', photo: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150', verified: true, testCompleted: true },
    compatibility: { score: 84, reasons: ['Profesionales', 'Ordenadas', 'Madrugadoras'], friction: 'Ella madruga mucho (6am)' },
  },
];

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const listing = mockListings.find((l) => l.id === id);

  if (!listing) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">{t('listings.detail.notFound')}</h1>
            <Button onClick={() => navigate('/listings')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('listings.detail.backToListings')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const typeLabels: Record<string, string> = {
    offering_room: t('listings.types.offeringRoom'),
    seeking_room: t('listings.types.seekingRoom'),
    seeking_roommate: t('listings.types.seekingRoommate'),
  };

  const ambianceLabels: Record<string, string> = {
    quiet: t('listings.detail.ambianceQuiet'),
    balanced: t('listings.detail.ambianceBalanced'),
    social: t('listings.detail.ambianceSocial'),
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/listings')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('listings.detail.backToListings')}
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photo Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Carousel className="w-full">
                  <CarouselContent>
                    {listing.photos.map((photo, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video rounded-xl overflow-hidden">
                          <img
                            src={photo}
                            alt={`${listing.title} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {listing.photos.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              </motion.div>

              {/* Title and Location */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Badge variant="secondary" className="mb-3">
                  {typeLabels[listing.type]}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {listing.title}
                </h1>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{listing.city}, {listing.neighborhood}</span>
                </div>
              </motion.div>

              {/* Key Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Euro className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-foreground">{listing.price}€</p>
                        <p className="text-xs text-muted-foreground">
                          {listing.billsIncluded ? t('listings.detail.billsIncluded') : t('listings.detail.billsNotIncluded')}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-foreground">
                          {new Date(listing.availableFrom).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('listings.detail.available')}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold text-foreground">{listing.minStay} {t('common.months')}</p>
                        <p className="text-xs text-muted-foreground">{t('listings.detail.minStay')}</p>
                      </div>
                      {listing.deposit && (
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Home className="w-5 h-5 mx-auto mb-1 text-primary" />
                          <p className="text-lg font-bold text-foreground">{listing.deposit}€</p>
                          <p className="text-xs text-muted-foreground">{t('listings.detail.deposit')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      {t('listings.detail.description')}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {listing.description}
                    </p>

                    {listing.ambiance && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">{t('listings.detail.ambiance')}: </span>
                        <Badge variant="outline">{ambianceLabels[listing.ambiance]}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Household Profile (for offering_room) */}
              {listing.householdProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {t('listings.detail.householdProfile')}
                      </h2>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('listings.detail.residents')}: </span>
                          <span className="text-foreground font-medium">{listing.householdProfile.residents}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('listings.detail.ages')}: </span>
                          <span className="text-foreground font-medium">{listing.householdProfile.ages}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{t('listings.detail.routine')}: </span>
                          <span className="text-foreground">{listing.householdProfile.routine}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* House Rules */}
              {listing.rules && listing.rules.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-3">
                        {t('listings.detail.rules')}
                      </h2>
                      <ul className="space-y-2">
                        {listing.rules.map((rule, index) => (
                          <li key={index} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="sticky top-20 space-y-4"
              >
                {/* Owner Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={listing.owner.photo} alt={listing.owner.name} />
                        <AvatarFallback>{listing.owner.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{listing.owner.name}</h3>
                        {listing.owner.verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('common.verified')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t('listings.detail.contact')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Compatibility Card */}
                {listing.compatibility && listing.owner.testCompleted && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {listing.compatibility.score}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('listings.detail.compatibility')}
                        </p>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                            {t('listings.detail.matchReasons')}
                          </p>
                          <ul className="space-y-1">
                            {listing.compatibility.reasons.map((reason, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {listing.compatibility.friction && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                              {t('listings.detail.possibleFriction')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              {listing.compatibility.friction}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListingDetail;
