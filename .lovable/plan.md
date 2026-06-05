# Restringir el envío de mensajes a matches reales

## Problema

Hoy mismo, cualquier usuario autenticado puede abrir un chat con cualquier otro y mandarle mensajes. La RPC `convinter_create_chat` solo comprueba bloqueos: no exige que los dos hayan hecho match (corazón mutuo en Discover o petición de test aceptada). `convinter_send_message` también permite cualquier mensaje mientras no contenga datos de contacto.

Esto contradice el modelo de privacidad de CONVINTER, donde un chat solo debería abrirse cuando hay consentimiento mutuo (consent_level ≥ 1 en `convinter_pair_consent`, que ya se crea automáticamente cuando hay like recíproco o cuando se acepta una petición de compatibilidad).

## Qué se va a cambiar

### 1. Backend (migración nueva: `migrations_manual/19_require_match_for_chat.sql` + migración Lovable Cloud equivalente)

- **`convinter_create_chat(p_other)`**: antes de crear/recuperar el chat, comprobar que existe una fila en `convinter_pair_consent` con `consent_level >= 1` para el par `(me, p_other)`. Si no existe, devolver `{ ok: false, code: 'NO_MATCH' }` sin crear nada.
- **`convinter_send_message(p_chat_id, p_body)`**: añadir la misma comprobación tras identificar al otro participante (defensa en profundidad por si quedaran chats huérfanos creados antes del cambio). Si el consent ha caído a 0, devolver `{ ok: false, code: 'NO_MATCH' }`.
- No se tocan policies de RLS ni el modelo de datos.

### 2. Frontend

- **`src/pages/Chat.tsx`**: manejar el nuevo código `NO_MATCH` mostrando un estado claro ("Aún no tenéis match. Cuando los dos os deis al corazón en Descubrir o aceptéis una petición de compatibilidad, se abrirá el chat.") y deshabilitando el input. Mismo trato si `convinter_send_message` devuelve `NO_MATCH`.
- **`src/pages/PublicProfile.tsx`** (y cualquier otro punto con botón "Enviar mensaje" / "Chat"): ocultar o deshabilitar el botón cuando no haya match. Si el usuario clica igualmente desde una ruta directa `/chat/:matchId`, la pantalla de Chat ya mostrará el aviso anterior.

### 3. Fuera de alcance

- No se cambia la lógica de cómo se crea el match (likes mutuos / aceptación de petición de test): ya funciona y crea `consent_level = 1` correctamente.
- No se borran chats antiguos sin match. La RPC `convinter_send_message` los bloqueará en runtime; opcional limpiarlos más adelante.
- No se toca el flujo de Discover, Matches ni el editor de perfil.

## Resultado esperado

Un usuario sólo puede abrir un chat y mandar mensajes a otro si:

1. Ambos se han dado al corazón en `/discover`, **o**
2. Uno pidió compatibilidad/test y el otro aceptó (consent_level ≥ 1).

En cualquier otro caso, las RPC devuelven `NO_MATCH` y la UI lo refleja con un mensaje explicativo.
