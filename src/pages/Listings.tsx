import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { MapPin, Euro, Calendar, Plus, Home, Search as SearchIcon, Users, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const mockListings = [
  // Madrid
  {
    id: 1,
    type: 'offer_room',
    title: 'Habitación luminosa en Malasaña',
    photo: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
    city: 'Madrid',
    neighborhood: 'Malasaña',
    price: 450,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Laura P.',
    ownerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    tags: ['No fumadores', 'Sin mascotas', 'Tranquilo'],
  },
  {
    id: 2,
    type: 'offer_room',
    title: 'Piso compartido cerca de Gran Vía',
    photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    city: 'Madrid',
    neighborhood: 'Centro',
    price: 520,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: '3 meses',
    owner: 'Miguel A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tags: ['Estudiantes', 'Social', 'Cocina compartida'],
  },
  {
    id: 3,
    type: 'seek_room',
    title: 'Busco habitación en Lavapiés',
    photo: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    city: 'Madrid',
    neighborhood: 'Lavapiés',
    price: 400,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: 'Indefinido',
    owner: 'Pablo S.',
    ownerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    tags: ['Artista', 'Flexible', 'Social'],
  },
  // Barcelona
  {
    id: 4,
    type: 'seek_room',
    title: 'Busco habitación en Gràcia',
    photo: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400',
    city: 'Barcelona',
    neighborhood: 'Gràcia',
    price: 500,
    billsIncluded: false,
    availableFrom: '2026-02-01',
    minStay: 'Indefinido',
    owner: 'Paula M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    tags: ['Profesional', 'Tranquilo', 'Teletrabajo'],
  },
  {
    id: 5,
    type: 'offer_room',
    title: 'Ático con vistas en Eixample',
    photo: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400',
    city: 'Barcelona',
    neighborhood: 'Eixample',
    price: 650,
    billsIncluded: true,
    availableFrom: '2026-03-01',
    minStay: '6 meses',
    owner: 'Jordi V.',
    ownerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    tags: ['Vistas', 'Ático', 'Reformado'],
  },
  // Valencia
  {
    id: 6,
    type: 'offer_room',
    title: 'Piso acogedor en Ruzafa',
    photo: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=400',
    city: 'Valencia',
    neighborhood: 'Ruzafa',
    price: 380,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Lucía F.',
    ownerPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
    tags: ['Artístico', 'Mascota OK', 'Balcón'],
  },
  {
    id: 7,
    type: 'seek_room',
    title: 'Busco piso en El Carmen',
    photo: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400',
    city: 'Valencia',
    neighborhood: 'El Carmen',
    price: 350,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: '3 meses',
    owner: 'David G.',
    ownerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    tags: ['Estudiante', 'Flexible', 'Nocturno'],
  },
  // Sevilla
  {
    id: 8,
    type: 'offer_room',
    title: 'Casa con patio en Triana',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
    city: 'Sevilla',
    neighborhood: 'Triana',
    price: 320,
    billsIncluded: true,
    availableFrom: '2026-02-10',
    minStay: '6 meses',
    owner: 'Rocío M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100',
    tags: ['Patio', 'Tradicional', 'Tranquilo'],
  },
  // Bilbao
  {
    id: 9,
    type: 'offer_room',
    title: 'Piso moderno en Casco Viejo',
    photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    city: 'Bilbao',
    neighborhood: 'Casco Viejo',
    price: 420,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Iker Z.',
    ownerPhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
    tags: ['Céntrico', 'Reformado', 'WiFi'],
  },
  // Zaragoza
  {
    id: 10,
    type: 'offer_room',
    title: 'Habitación amplia en Centro',
    photo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    city: 'Zaragoza',
    neighborhood: 'Centro',
    price: 300,
    billsIncluded: true,
    availableFrom: '2026-02-15',
    minStay: '3 meses',
    owner: 'Jorge N.',
    ownerPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
    tags: ['Económico', 'Amplio', 'Luminoso'],
  },
  // Málaga
  {
    id: 11,
    type: 'offer_room',
    title: 'Habitación cerca de la playa',
    photo: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400',
    city: 'Málaga',
    neighborhood: 'El Palo',
    price: 400,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '4 meses',
    owner: 'Marina C.',
    ownerPhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100',
    tags: ['Playa', 'Luminoso', 'Tranquilo'],
  },
  // San Sebastián
  {
    id: 12,
    type: 'offer_room',
    title: 'Piso con vistas al mar',
    photo: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    city: 'San Sebastián',
    neighborhood: 'Gros',
    price: 550,
    billsIncluded: true,
    availableFrom: '2026-03-01',
    minStay: '6 meses',
    owner: 'Leire A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100',
    tags: ['Vistas mar', 'Premium', 'Tranquilo'],
  },
  // Granada
  {
    id: 13,
    type: 'offer_room',
    title: 'Habitación en el Albaicín',
    photo: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400',
    city: 'Granada',
    neighborhood: 'Albaicín',
    price: 300,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '3 meses',
    owner: 'Fernando L.',
    ownerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    tags: ['Histórico', 'Vistas Alhambra', 'Bohemio'],
  },
  // Alicante
  {
    id: 14,
    type: 'seek_room',
    title: 'Busco habitación cerca del puerto',
    photo: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400',
    city: 'Alicante',
    neighborhood: 'Centro',
    price: 350,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: 'Indefinido',
    owner: 'Elena P.',
    ownerPhoto: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100',
    tags: ['Profesional', 'Playa', 'Madrugador'],
  },
  // Las Palmas de Gran Canaria (Canarias)
  {
    id: 15,
    type: 'offer_room',
    title: 'Habitación con vistas al mar',
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
    city: 'Las Palmas de Gran Canaria',
    neighborhood: 'Las Canteras',
    price: 420,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Sergio R.',
    ownerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tags: ['Playa', 'Luminoso', 'Clima ideal'],
  },
  // Santa Cruz de Tenerife (Canarias)
  {
    id: 16,
    type: 'seek_room',
    title: 'Busco piso cerca del centro',
    photo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    city: 'Santa Cruz de Tenerife',
    neighborhood: 'Centro',
    price: 380,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: '4 meses',
    owner: 'Yaiza M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    tags: ['Profesional', 'Tranquilo', 'Teletrabajo'],
  },
  // Palma de Mallorca (Baleares)
  {
    id: 17,
    type: 'offer_room',
    title: 'Ático luminoso en el centro',
    photo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    city: 'Palma de Mallorca',
    neighborhood: 'Santa Catalina',
    price: 580,
    billsIncluded: true,
    availableFrom: '2026-03-01',
    minStay: '6 meses',
    owner: 'Margalida F.',
    ownerPhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    tags: ['Terraza', 'Vistas', 'Premium'],
  },
  // A Coruña (Galicia)
  {
    id: 18,
    type: 'offer_room',
    title: 'Piso en la Marina',
    photo: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400',
    city: 'A Coruña',
    neighborhood: 'Marina',
    price: 350,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Xoán L.',
    ownerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    tags: ['Vistas mar', 'Céntrico', 'Tranquilo'],
  },
  // Vigo (Galicia)
  {
    id: 19,
    type: 'seek_room',
    title: 'Busco habitación cerca de la playa',
    photo: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400',
    city: 'Vigo',
    neighborhood: 'Samil',
    price: 320,
    billsIncluded: false,
    availableFrom: '2026-01-25',
    minStay: 'Indefinido',
    owner: 'Antía R.',
    ownerPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
    tags: ['Estudiante', 'Playa', 'Social'],
  },
  // Oviedo (Asturias)
  {
    id: 20,
    type: 'offer_room',
    title: 'Habitación en el centro histórico',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
    city: 'Oviedo',
    neighborhood: 'Centro',
    price: 320,
    billsIncluded: true,
    availableFrom: '2026-02-10',
    minStay: '6 meses',
    owner: 'Pelayo G.',
    ownerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    tags: ['Histórico', 'Tranquilo', 'Sidrería'],
  },
  // Santander (Cantabria)
  {
    id: 21,
    type: 'offer_room',
    title: 'Piso con vistas a la bahía',
    photo: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    city: 'Santander',
    neighborhood: 'El Sardinero',
    price: 400,
    billsIncluded: true,
    availableFrom: '2026-02-15',
    minStay: '6 meses',
    owner: 'Carmen S.',
    ownerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    tags: ['Vistas', 'Playa', 'Luminoso'],
  },
  // Pamplona (Navarra)
  {
    id: 22,
    type: 'seek_room',
    title: 'Busco piso en Ensanche',
    photo: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400',
    city: 'Pamplona',
    neighborhood: 'Ensanche',
    price: 380,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: '4 meses',
    owner: 'Mikel A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    tags: ['Profesional', 'Deportivo', 'Tranquilo'],
  },
  // Logroño (La Rioja)
  {
    id: 23,
    type: 'offer_room',
    title: 'Habitación en Casco Antiguo',
    photo: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    city: 'Logroño',
    neighborhood: 'Casco Antiguo',
    price: 280,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'María J.',
    ownerPhoto: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100',
    tags: ['Económico', 'Céntrico', 'Vino'],
  },
  // Valladolid (Castilla y León)
  {
    id: 24,
    type: 'offer_room',
    title: 'Piso cerca de la Universidad',
    photo: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    city: 'Valladolid',
    neighborhood: 'Centro',
    price: 300,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '3 meses',
    owner: 'Carlos M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
    tags: ['Estudiantes', 'Económico', 'WiFi'],
  },
  // Salamanca (Castilla y León)
  {
    id: 25,
    type: 'seek_room',
    title: 'Busco habitación universitaria',
    photo: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    city: 'Salamanca',
    neighborhood: 'Centro',
    price: 280,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: '9 meses',
    owner: 'Andrea P.',
    ownerPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    tags: ['Estudiante', 'Social', 'Joven'],
  },
  // Toledo (Castilla-La Mancha)
  {
    id: 26,
    type: 'offer_room',
    title: 'Habitación con vistas al Alcázar',
    photo: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400',
    city: 'Toledo',
    neighborhood: 'Casco Histórico',
    price: 320,
    billsIncluded: true,
    availableFrom: '2026-02-10',
    minStay: '6 meses',
    owner: 'Javier R.',
    ownerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    tags: ['Histórico', 'Vistas', 'Tranquilo'],
  },
  // Cáceres (Extremadura)
  {
    id: 27,
    type: 'offer_room',
    title: 'Piso en Ciudad Monumental',
    photo: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400',
    city: 'Cáceres',
    neighborhood: 'Ciudad Monumental',
    price: 250,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Lucía T.',
    ownerPhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100',
    tags: ['Económico', 'Histórico', 'Tranquilo'],
  },
  // Badajoz (Extremadura)
  {
    id: 28,
    type: 'seek_room',
    title: 'Busco habitación céntrica',
    photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
    city: 'Badajoz',
    neighborhood: 'Centro',
    price: 230,
    billsIncluded: false,
    availableFrom: '2026-01-25',
    minStay: 'Indefinido',
    owner: 'Antonio F.',
    ownerPhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100',
    tags: ['Profesional', 'Económico', 'Tranquilo'],
  },
  // Murcia
  {
    id: 29,
    type: 'offer_room',
    title: 'Habitación amplia cerca del río',
    photo: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    city: 'Murcia',
    neighborhood: 'Centro',
    price: 300,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Paco H.',
    ownerPhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
    tags: ['Amplio', 'Céntrico', 'Luminoso'],
  },
  // Almería (Andalucía)
  {
    id: 30,
    type: 'offer_room',
    title: 'Piso cerca del puerto',
    photo: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400',
    city: 'Almería',
    neighborhood: 'Puerto',
    price: 320,
    billsIncluded: true,
    availableFrom: '2026-02-15',
    minStay: '4 meses',
    owner: 'Raquel M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100',
    tags: ['Playa', 'Vistas', 'Tranquilo'],
  },
  // Córdoba (Andalucía)
  {
    id: 31,
    type: 'seek_room',
    title: 'Busco habitación en Judería',
    photo: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=400',
    city: 'Córdoba',
    neighborhood: 'Judería',
    price: 280,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: '6 meses',
    owner: 'Rafael C.',
    ownerPhoto: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=100',
    tags: ['Histórico', 'Cultural', 'Tranquilo'],
  },
  // Huelva (Andalucía)
  {
    id: 32,
    type: 'offer_room',
    title: 'Habitación cerca de la playa',
    photo: 'https://images.unsplash.com/photo-1529408686214-b48b8532f72c?w=400',
    city: 'Huelva',
    neighborhood: 'Punta Umbría',
    price: 280,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '4 meses',
    owner: 'Rocío L.',
    ownerPhoto: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100',
    tags: ['Playa', 'Económico', 'Tranquilo'],
  },
  // Jaén (Andalucía)
  {
    id: 33,
    type: 'offer_room',
    title: 'Piso en el centro histórico',
    photo: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=400',
    city: 'Jaén',
    neighborhood: 'Centro',
    price: 250,
    billsIncluded: true,
    availableFrom: '2026-02-10',
    minStay: '6 meses',
    owner: 'Manuel O.',
    ownerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    tags: ['Económico', 'Histórico', 'Aceite'],
  },
  // Lleida (Cataluña)
  {
    id: 34,
    type: 'seek_room',
    title: 'Busco piso cerca de la universidad',
    photo: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400',
    city: 'Lleida',
    neighborhood: 'Centro',
    price: 300,
    billsIncluded: false,
    availableFrom: '2026-01-15',
    minStay: '9 meses',
    owner: 'Núria P.',
    ownerPhoto: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100',
    tags: ['Estudiante', 'Económico', 'Tranquilo'],
  },
  // Girona (Cataluña)
  {
    id: 35,
    type: 'offer_room',
    title: 'Habitación en Barri Vell',
    photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
    city: 'Girona',
    neighborhood: 'Barri Vell',
    price: 420,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Pere M.',
    ownerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    tags: ['Histórico', 'Vistas', 'Tranquilo'],
  },
  // Tarragona (Cataluña)
  {
    id: 36,
    type: 'offer_room',
    title: 'Piso con vistas al Mediterráneo',
    photo: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    city: 'Tarragona',
    neighborhood: 'Part Alta',
    price: 380,
    billsIncluded: true,
    availableFrom: '2026-02-15',
    minStay: '6 meses',
    owner: 'Montse R.',
    ownerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    tags: ['Vistas mar', 'Romano', 'Cultural'],
  },
  // Castellón (C. Valenciana)
  {
    id: 37,
    type: 'seek_room',
    title: 'Busco habitación en Grao',
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
    city: 'Castellón',
    neighborhood: 'El Grao',
    price: 320,
    billsIncluded: false,
    availableFrom: '2026-01-20',
    minStay: '4 meses',
    owner: 'Vicent G.',
    ownerPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    tags: ['Playa', 'Profesional', 'Tranquilo'],
  },
  // Burgos (Castilla y León)
  {
    id: 38,
    type: 'offer_room',
    title: 'Habitación cerca de la Catedral',
    photo: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400',
    city: 'Burgos',
    neighborhood: 'Centro',
    price: 280,
    billsIncluded: true,
    availableFrom: '2026-02-01',
    minStay: '6 meses',
    owner: 'Luis A.',
    ownerPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
    tags: ['Histórico', 'Económico', 'Tranquilo'],
  },
  // León (Castilla y León)
  {
    id: 39,
    type: 'offer_room',
    title: 'Piso en Barrio Húmedo',
    photo: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
    city: 'León',
    neighborhood: 'Barrio Húmedo',
    price: 290,
    billsIncluded: true,
    availableFrom: '2026-02-10',
    minStay: '6 meses',
    owner: 'Sara V.',
    ownerPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
    tags: ['Tapas', 'Social', 'Céntrico'],
  },
  // Albacete (Castilla-La Mancha)
  {
    id: 40,
    type: 'seek_room',
    title: 'Busco piso céntrico',
    photo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    city: 'Albacete',
    neighborhood: 'Centro',
    price: 260,
    billsIncluded: false,
    availableFrom: '2026-01-25',
    minStay: 'Indefinido',
    owner: 'Pedro N.',
    ownerPhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
    tags: ['Económico', 'Profesional', 'Tranquilo'],
  },
];

// Extraer ciudades únicas
const cities = [...new Set(mockListings.map(l => l.city))].sort();

// Rango de precios
const MIN_PRICE = 200;
const MAX_PRICE = 700;

export default function Listings() {
  const { t } = useTranslation();
  
  // Estados de los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);
  const [activeTab, setActiveTab] = useState('all');
  const [cityOpen, setCityOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  // Filtrado combinado
  const filteredListings = useMemo(() => {
    return mockListings.filter(listing => {
      // Filtro de texto
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        listing.title.toLowerCase().includes(searchLower) ||
        listing.city.toLowerCase().includes(searchLower) ||
        listing.neighborhood.toLowerCase().includes(searchLower) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      // Filtro de ciudad
      const matchesCity = !selectedCity || listing.city === selectedCity;
      
      // Filtro de precio
      const matchesPrice = listing.price >= priceRange[0] && listing.price <= priceRange[1];
      
      // Filtro de tipo (tab)
      const matchesType = activeTab === 'all' || 
        (activeTab === 'offer' && listing.type === 'offer_room') ||
        (activeTab === 'seek' && listing.type === 'seek_room');
      
      return matchesSearch && matchesCity && matchesPrice && matchesType;
    });
  }, [searchTerm, selectedCity, priceRange, activeTab]);

  const hasActiveFilters = searchTerm || selectedCity || priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE || activeTab !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity(null);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setActiveTab('all');
  };

  const ListingCard = ({ listing }: { listing: typeof mockListings[0] }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden card-hover"
    >
      <div className="relative h-48">
        <img 
          src={listing.photo} 
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className={`rounded-full ${listing.type === 'offer_room' ? 'bg-success' : 'bg-secondary'}`}>
            {listing.type === 'offer_room' ? t('listings.types.offerRoom') : t('listings.types.seekRoom')}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm font-semibold">
          <Euro className="h-4 w-4" />
          {listing.price}/mes
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            {listing.neighborhood}, {listing.city}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="outline" className="rounded-full text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <img 
              src={listing.ownerPhoto} 
              alt={listing.owner}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium">{listing.owner}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(listing.availableFrom).toLocaleDateString('es')}
          </div>
        </div>

        <Link to={`/listing/${listing.id}`}>
          <Button variant="outline" className="w-full">
            {t('listings.viewDetails')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('listings.title')}</h1>
          </div>
          <Link to="/create-listing">
            <Button variant="hero" className="gap-2">
              <Plus className="h-5 w-5" />
              {t('listings.createListing')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t('common.search') + '...'} 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* City Selector */}
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedCity || 'Toda España'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Buscar ciudad..." />
                  <CommandList>
                    <CommandEmpty>No se encontró la ciudad.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedCity(null);
                          setCityOpen(false);
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${!selectedCity ? 'opacity-100' : 'opacity-0'}`} />
                        Toda España
                      </CommandItem>
                      {cities.map((city) => (
                        <CommandItem
                          key={city}
                          onSelect={() => {
                            setSelectedCity(city);
                            setCityOpen(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedCity === city ? 'opacity-100' : 'opacity-0'}`} />
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Price Range Selector */}
            <Popover open={priceOpen} onOpenChange={setPriceOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Euro className="h-4 w-4" />
                  {priceRange[0] === MIN_PRICE && priceRange[1] === MAX_PRICE 
                    ? 'Precio' 
                    : `${priceRange[0]}€ - ${priceRange[1]}€`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] bg-popover" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rango de precio</span>
                    <span className="text-sm text-muted-foreground">
                      {priceRange[0]}€ - {priceRange[1]}€
                    </span>
                  </div>
                  <Slider
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{MIN_PRICE}€</span>
                    <span>{MAX_PRICE}€</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar filtros">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all" className="gap-2">
              <Home className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="offer" className="gap-2">
              <Home className="h-4 w-4" />
              {t('listings.types.offerRoom')}
            </TabsTrigger>
            <TabsTrigger value="seek" className="gap-2">
              <Users className="h-4 w-4" />
              {t('listings.types.seekRoom')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results Counter */}
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {filteredListings.length} de {mockListings.length} anuncios
        </div>

        {/* Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-muted-foreground mb-4">
              No se encontraron anuncios con estos filtros.
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}