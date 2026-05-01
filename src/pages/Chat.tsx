import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SafetyActions } from '@/components/SafetyActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

type Message = {
  id: number | string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  optimistic?: boolean;
};

type MessageRow = {
  id: number;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string | null;
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

type SendMessageResponse = {
  ok?: boolean;
  message_id?: number;
  code?: string;
};

const toMessage = (message: MessageRow): Message => ({
  id: message.id,
  chat_id: message.chat_id,
  sender_id: message.sender_id,
  body: message.body,
  created_at: message.created_at ?? new Date().toISOString(),
});

export default function Chat() {
  useSEO({ page: 'matches', noIndex: true });

  const { matchId } = useParams<{ matchId: string }>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ProfileLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const loadOtherProfile = useCallback(async (user: string) => {
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
  }, []);

  const loadMessages = useCallback(async (chat: string) => {
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

    setMessages((data ?? []).map(toMessage));
  }, []);

  const markChatRead = useCallback(async (chat: string) => {
    const { data, error: readError } = await supabase.rpc('convinter_mark_chat_read', {
      p_chat_id: chat,
    });

    if (readError) {
      console.warn('No se pudo marcar el chat como leido', readError);
      return;
    }

    const result = data as unknown as { ok?: boolean };
    if (result?.ok !== false) {
      window.dispatchEvent(new CustomEvent('convinter:messages-read'));
    }
  }, []);

  const initializeChat = useCallback(async () => {
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

      const { data: blockedData, error: blockError } = await supabase.rpc('convinter_is_blocked', {
        p_user_a: sessionUser.id,
        p_user_b: matchId,
      });

      if (blockError) {
        console.warn('No se pudo comprobar el bloqueo del chat', blockError);
      }

      if (blockedData) {
        setIsBlocked(true);
      }

      const { data, error: createError } = await supabase.rpc('convinter_create_chat', {
        p_other: matchId,
      });

      if (createError) throw createError;

      const result = data as unknown as CreateChatResponse;
      if (!result?.ok || !result.chat_id) {
        if (result?.code === 'BLOCKED') {
          setIsBlocked(true);
          setError('Has bloqueado a este usuario. No puedes enviarle mensajes.');
        } else {
          setError(`No se pudo crear/abrir el chat: ${result?.code ?? 'unknown'}`);
        }
        setIsLoading(false);
        return;
      }

      setChatId(result.chat_id);

      await Promise.all([loadMessages(result.chat_id), loadOtherProfile(matchId), markChatRead(result.chat_id)]);
    } catch (err) {
      console.error('Error inicializando chat', err);
      setError('No se pudo cargar el chat. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages, loadOtherProfile, markChatRead, matchId]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`convinter-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convinter_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const inserted = payload.new as MessageRow;

          setMessages((current) => {
            if (current.some((message) => String(message.id) === String(inserted.id))) {
              return current;
            }

            const withoutMatchingOptimistic = current.filter((message) => {
              return !(message.optimistic && message.sender_id === inserted.sender_id && message.body === inserted.body);
            });

            return [...withoutMatchingOptimistic, toMessage(inserted)];
          });

          void markChatRead(chatId);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, markChatRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId) return;
    if (isBlocked) {
      toast.info('Has bloqueado a este usuario.');
      return;
    }
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

    try {
      const { data, error: sendError } = await supabase.rpc('convinter_send_message', {
        p_chat_id: chatId,
        p_body: body,
      });

      if (sendError) throw sendError;

      const result = data as unknown as SendMessageResponse;
      if (result.ok === false) {
        toast.error(result.code === 'NOT_A_PARTICIPANT' ? 'No perteneces a este chat' : 'No se pudo enviar el mensaje');
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        return;
      }

      if (result.message_id) {
        setMessages(prev =>
          prev.map(m =>
            m.id === optimisticId ? { ...m, id: result.message_id!, optimistic: false } : m
          )
        );
      }

      await loadMessages(chatId);
      await markChatRead(chatId);
    } catch (err) {
      console.error('Error enviando mensaje', err);
      toast.error('No se pudo enviar el mensaje');
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
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
            <Button asChild variant="outline" size="sm">
              <Link to={`/u/${matchId}`}>Ver perfil</Link>
            </Button>
            {matchId && (
              <SafetyActions
                targetType="user"
                targetId={matchId}
                targetUserId={matchId}
                targetName={headingName}
                compact
                onBlocked={() => setIsBlocked(true)}
              />
            )}
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
            <div className="text-center text-muted-foreground text-sm py-8">
              No hay mensajes todavia. Empieza la conversacion cuando quieras.
            </div>
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
                <div className={`flex items-center gap-2 mt-1 ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
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
                  {message.sender_id !== userId && typeof message.id === 'number' && (
                    <SafetyActions
                      targetType="message"
                      targetId={message.id}
                      compact
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isBlocked || !!error || isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isBlocked || !newMessage.trim() || isSending || !!error || isLoading}>
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
