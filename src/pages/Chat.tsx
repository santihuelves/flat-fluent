import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data de matches (sincronizado con Matches.tsx)
const mockMatches = [
  {
    id: '1',
    name: 'María García',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    score: 94,
  },
  {
    id: '2',
    name: 'Carlos Ruiz',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    score: 91,
  },
  {
    id: '3',
    name: 'Laura Martínez',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    score: 88,
  },
];

// Mock messages
const mockMessages = [
  {
    id: '1',
    senderId: 'match',
    text: '¡Hola! Vi que tenemos un 94% de compatibilidad, ¡qué bien! 😊',
    timestamp: '10:30',
    read: true,
  },
  {
    id: '2',
    senderId: 'me',
    text: '¡Hola María! Sí, me pareció muy interesante tu perfil. Veo que también eres desarrolladora.',
    timestamp: '10:32',
    read: true,
  },
  {
    id: '3',
    senderId: 'match',
    text: 'Sí! Trabajo remoto la mayor parte del tiempo. ¿Tú también?',
    timestamp: '10:33',
    read: true,
  },
  {
    id: '4',
    senderId: 'me',
    text: 'Exacto, teletrabajo casi siempre. Por eso busco un piso tranquilo donde pueda concentrarme.',
    timestamp: '10:35',
    read: true,
  },
  {
    id: '5',
    senderId: 'match',
    text: 'Perfecto, yo igual. Tengo una habitación disponible en mi piso de Malasaña. ¿Te gustaría verlo?',
    timestamp: '10:38',
    read: true,
  },
];

export default function Chat() {
  const { matchId } = useParams();
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const match = mockMatches.find(m => m.id === matchId) || mockMatches[0];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: String(messages.length + 1),
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-card">
          <Link to="/matches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <Avatar className="h-12 w-12">
            <AvatarImage src={match.photo} alt={match.name} />
            <AvatarFallback>{match.name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold">{match.name}</h2>
            <p className="text-sm text-muted-foreground">
              {match.score}% compatible • En línea
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.senderId === 'me'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border rounded-bl-md'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  message.senderId === 'me' ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-xs ${
                    message.senderId === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp}
                  </span>
                  {message.senderId === 'me' && (
                    message.read 
                      ? <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                      : <Check className="h-3 w-3 text-primary-foreground/70" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
