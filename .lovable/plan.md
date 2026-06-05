## Problema

En `/listings`, la rejilla muestra 3 columnas a partir de `lg` (≥1024px). Con la ventana en ~1062px, cada tarjeta queda en ~330px, pero `RoomListingSummaryCard` fuerza layout horizontal `sm:grid-cols-[180px_1fr]` desde 640px. Resultado: foto a la izquierda y panel derecho cortado (precio, badges, botón "Ver detalles" truncados), justo como muestra la captura.

## Fix

Cambiar el layout interno de `src/components/listings/RoomListingSummaryCard.tsx` para que la tarjeta sea **vertical por defecto** (imagen arriba ocupando todo el ancho, contenido debajo). El layout horizontal de 2 columnas solo debería activarse cuando la tarjeta tiene espacio real (cuando el grid contenedor está en 1 columna, no en 3).

Opción más simple y robusta — y la que coincide con "como antes": eliminar el layout horizontal por completo y dejar siempre stack vertical:

- Quitar `grid sm:grid-cols-[180px_1fr]` → usar `flex flex-col`.
- Imagen: `w-full h-48 object-cover` (sin variante `sm:h-full`).
- Padding/contenido sin cambios.

Esto afecta a las dos pantallas que usan la tarjeta: `Listings.tsx` (grid de 1/2/3 columnas) y `MyListings.tsx`. En ambos casos la tarjeta vertical encaja correctamente.

## Archivos

- `src/components/listings/RoomListingSummaryCard.tsx` — cambiar el wrapper `<div className="grid sm:grid-cols-[180px_1fr]">` y la `<img>` para layout vertical.

No se tocan datos, RPCs ni lógica de negocio. Solo presentación.
