import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X, Home, Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const cities = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 
  'Zaragoza', 'Málaga', 'Granada', 'San Sebastián', 'Alicante',
  'A Coruña', 'Palma de Mallorca'
];

const listingTypes = [
  { value: 'offer_room', label: 'Ofrezco habitación', icon: Home, description: 'Tengo una habitación disponible' },
  { value: 'seek_room', label: 'Busco habitación', icon: Search, description: 'Busco una habitación para alquilar' },
  { value: 'seek_roommate', label: 'Busco compañero/a', icon: Users, description: 'Busco alguien para alquilar juntos' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    city: '',
    neighborhood: '',
    price: '',
    expensesIncluded: false,
    availableDate: '',
    minStay: '6',
    photos: [] as string[],
  });

  const handleTypeSelect = (type: string) => {
    setFormData({ ...formData, type });
    setStep(2);
  };

  const handleSubmit = () => {
    toast.success('¡Anuncio creado correctamente!', {
      description: 'Tu anuncio será visible para otros usuarios.',
    });
    navigate('/listings');
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/listings')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step > 1 ? 'Anterior' : 'Volver a anuncios'}
        </Button>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Type Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">Crear anuncio</h1>
            <p className="text-muted-foreground mb-8">
              ¿Qué tipo de anuncio quieres publicar?
            </p>

            <div className="grid gap-4">
              {listingTypes.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    formData.type === type.value ? 'border-primary bg-primary/5' : ''
                  }`}
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

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">Información básica</h1>
            <p className="text-muted-foreground mb-8">
              Cuéntanos más sobre tu anuncio
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del anuncio</Label>
                <Input
                  id="title"
                  placeholder="Ej: Habitación luminosa en el centro"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el espacio, el ambiente del piso, qué buscas en un compañero/a..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                  >
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
                  <Label htmlFor="neighborhood">Barrio</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Ej: Malasaña"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={() => setStep(3)}>
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Details & Photos */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">Detalles y fotos</h1>
            <p className="text-muted-foreground mb-8">
              Añade los últimos detalles
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio mensual (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="450"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStay">Estancia mínima (meses)</Label>
                  <Select
                    value={formData.minStay}
                    onValueChange={(value) => setFormData({ ...formData, minStay: value })}
                  >
                    <SelectTrigger>
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
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Gastos incluidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Agua, luz, internet, etc.
                  </p>
                </div>
                <Switch
                  checked={formData.expensesIncluded}
                  onCheckedChange={(checked) => setFormData({ ...formData, expensesIncluded: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableDate">Fecha disponible</Label>
                <Input
                  id="availableDate"
                  type="date"
                  value={formData.availableDate}
                  onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Fotos</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra fotos aquí o haz clic para subir
                  </p>
                  <Button variant="outline" className="mt-4">
                    Seleccionar fotos
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={handleSubmit}>
                Publicar anuncio
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
