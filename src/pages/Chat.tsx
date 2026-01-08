import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Message = {
  id: number | string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  optimistic?: boolean;
};

type ProfileLite = {
  display_name: string | null;
  photo_url: string | null;
  city: string | null;
  province_code: string | null;
};

type CreateChatResponse = {
  ok: boolean;
  chat_id?: string;
  code?: string;
};

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ProfileLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeChat();
  }, [matchId]);

  const initializeChat = async () => {
    setIsLoading(true);
    setError(null);

    if (!matchId) {
      setError('Chat no encontrado (falta matchId en la ruta).');
      setIsLoading(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;
      if (!sessionUser) {
        setError('Debes iniciar sesión para usar el chat.');
        setIsLoading(false);
        return;
      }
      setUserId(sessionUser.id);

      const { data, error: createError } = await supabase.rpc('convinter_create_chat', {
        p_other: matchId,
      });

      if (createError) throw createError;

      const result = data as unknown as CreateChatResponse;
      if (!result?.ok || !result.chat_id) {
        setError(`No se pudo crear/abrir el chat: ${result?.code ?? 'unknown'}`);
        setIsLoading(false);
        return;
      }

      setChatId(result.chat_id);

      await Promise.all([loadMessages(result.chat_id), loadOtherProfile(matchId)]);
    } catch (err) {
      console.error('Error inicializando chat', err);
      setError('No se pudo cargar el chat. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOtherProfile = async (user: string) => {
    const { data, error: profileError } = await supabase
      .from('convinter_profiles')
      .select('display_name, photo_url, city, province_code')
      .eq('user_id', user)
      .maybeSingle();

    if (profileError) {
      console.warn('No se pudo cargar el perfil del otro usuario', profileError);
      return;
    }

    if (data) {
      setOtherProfile(data as ProfileLite);
    }
  };

  const loadMessages = async (chat: string) => {
    const { data, error: msgError } = await supabase
      .from('convinter_messages')
      .select('*')
      .eq('chat_id', chat)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error cargando mensajes', msgError);
      toast.error('No se pudieron cargar los mensajes');
      return;
    }

    setMessages(
      (data ?? []).map(m => ({
        id: m.id,
        chat_id: m.chat_id,
        sender_id: m.sender_id,
        body: m.body,
        created_at: m.created_at ?? new Date().toISOString(),
      }))
    );
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId) return;
    if (!userId) {
      toast.error('Necesitas iniciar sesión para enviar mensajes');
      return;
    }

    const body = newMessage.trim();
    const optimisticId = `tmp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setIsSending(true);

    const { data, error: sendError } = await supabase.rpc('convinter_send_message', {
      p_chat_id: chatId,
      p_body: body,
    });

    if (sendError) {
      console.error('Error enviando mensaje', sendError);
      toast.error('No se pudo enviar el mensaje');
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setIsSending(false);
      return;
    }

    const messageId = (data as { message_id?: number })?.message_id;
    if (messageId) {
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticId ? { ...m, id: messageId, optimistic: false } : m
        )
      );
    }

    await loadMessages(chatId);
    setIsSending(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const headingName = useMemo(() => {
    return otherProfile?.display_name || 'Contacto';
  }, [otherProfile]);

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
            <AvatarImage src={otherProfile?.photo_url ?? ''} alt={headingName} />
            <AvatarFallback>{headingName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-semibold">{headingName}</h2>
            <p className="text-sm text-muted-foreground">
              {otherProfile?.city ?? 'En línea'}
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
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {!isLoading && !error && messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm">No hay mensajes todavía.</div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.sender_id === userId
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border rounded-bl-md'
                }`}
              >
                <p className="text-sm break-words">{message.body}</p>
                <div
                  className={`flex items-center gap-2 mt-1 ${
                    message.sender_id === userId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span
                    className={`text-xs ${
                      message.sender_id === userId
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </span>
                  {message.optimistic && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary-foreground/70" />
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
              onKeyDown={handleKeyPress}
              disabled={!!error || isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || isSending || !!error || isLoading}>
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
