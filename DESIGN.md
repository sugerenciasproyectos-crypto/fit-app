# DESIGN.md · Ticket de supermercado

Sistema de diseño de la app tal y como está construida (Design Brief §3–§9). Fuente de verdad de los colores: `src/ui/tokens/tokens.ts`, reflejados en `src/index.css` (un test comprueba que coinciden y que cumplen el contraste).

## Tesis
Cada día es un **ticket de caja**: comidas como secciones, alimentos como renglones con puntos guía y, arriba, el **RESTANTE** en cifra de display. Sin sombras, sin gradientes, sin colores por macro. Modo **Operate**: la personalidad está en los detalles tipográficos, no en adornos.

## Color
| Token | Claro | Oscuro (papel carbón) | Uso |
|---|---|---|---|
| `--paper` | `#fbfaf6` | `#1f1e1b` | Fondo |
| `--paper-2` | `#f2f0e9` | `#292825` | Pistas de barras, esqueletos |
| `--ink` | `#1b1a17` | `#eeeae0` | Texto, barras, tendencia |
| `--ink-2` | `#5f5b52` | `#aaa496` | Etiquetas, unidades, valores secundarios |
| `--rule` | `#c9c4b7` | `#4a4740` | Filetes, guiones, puntos guía, rejilla |
| `--alert` | `#b3261e` | `#ff8a80` | **Solo** exceso, errores y ⚠ revisar |
| `--action` | `#1f3f9a` | `#9db4ff` | **Solo** botón primario, "+", enlaces y foco |
| `--action-ink` | `#ffffff` | `#10182f` | Texto sobre `--action` |
| `--sel` | `#dfe5f7` | `#2e3a5e` | Selección |

Todos los pares texto/fondo ≥ 4.5:1 en los dos modos (test `tokens.test.ts`). El modo sigue al sistema (`prefers-color-scheme`) y se puede forzar con `data-theme`. Tailwind expone los tokens como `bg-paper`, `text-ink-2`, `border-rule`, etc.; ningún componente usa colores literales.

## Tipografía
- **Cifras y renglones:** `--mono` = `ui-monospace, "SF Mono", Menlo, Consolas` (0 KB) con la clase `.num` → `font-variant-numeric: tabular-nums`.
- **Interfaz:** `--sans` = `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui`.
- **Escala:** RESTANTE `clamp(2.75rem, 15vw, 4rem)`; títulos `text-2xl` en mono; cabeceras de sección en mono, mayúsculas, `tracking-[0.12em]`, `text-xs`/`text-sm`; cuerpo 16 px; metadatos `text-xs`.
- Unidades en `rem`: aguanta el texto al 200 % sin desbordar (E2E `a11y.spec.ts`).

## Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Renglón con puntos guía (`Leader`) | `ui/primitives.tsx` | nombre · `.leader` (borde punteado) · cifra tabular |
| Botón | `ui/primitives.tsx` | `primary` (azul tinta), `ghost` (filete), `danger` (contorno rojo, apartado al final) · 44 px mínimo |
| Campo de texto / selector | `ui/primitives.tsx` | etiqueta visible, error en rojo con `aria-describedby`, sufijo de unidad |
| Hoja inferior (`Sheet`) | `ui/Sheet.tsx` | sube en 200 ms, `role="dialog"`, foco en `[data-autofocus]`, Escape/fondo/Cerrar |
| Toast | `ui/toast.tsx` | franja de ticket invertida, 5 s, acción DESHACER/REINTENTAR, `aria-live="polite"` |
| Bloque RESTANTE | `features/diary/RemainingBlock.tsx` | cifra, barra de kcal, P/C/G con `role="progressbar"`, EXCESO en rojo con "+", ½ parcial |
| Sección de comida y renglón del diario | `features/diary/TodayPage.tsx` | `NOMBRE ..... subtotal +`, "— sin registros —", deslizar para eliminar |
| FAB "+" | `features/diary/TodayPage.tsx` | 56 px, azul tinta, sobre la barra de pestañas |
| Tarjeta de propuesta | `features/tdee/ProposalCard.tsx` | fondo invertido, `[!]`, Aceptar · Rechazar · Detalle |
| Ficha de producto | `features/products/ProductPage.tsx` | tabla nutricional con filetes gruesos como una etiqueta |
| Gráficas | `features/progress/ProgressPage.tsx` | Recharts sin animación: puntos `--ink-2`, tendencia 1,5 px `--ink`, rejilla punteada, TDEE en escalones |
| Barra de pestañas | `ui/AppShell.tsx` | Lucide 1,5 px; activa en tinta y subrayada |

## Movimiento
- Hojas: `sheet-in` 200 ms *ease-out*.
- Firma: **imprimir el renglón** (`print-row`), 180 ms con `clip-path` de arriba abajo al registrar.
- Las cifras cambian al instante. Vibración ligera al registrar y al leer un código (si el navegador la ofrece).
- `prefers-reduced-motion`: sin animaciones.

## Espacio y diseño
- Columna de 480 px máx. centrada; Progreso se amplía a 720 px en pantallas anchas.
- Áreas seguras con `env(safe-area-inset-*)` (`pt-safe`, `pb-safe`).
- Separadores: `border-dashed border-rule` entre secciones; filetes de 1 px; nunca sombras.

## Accesibilidad
- Objetivos táctiles ≥ 44 px; renglones ≥ 48 px.
- Foco visible: contorno de 2 px en `--action`.
- Renglones legibles por VoiceOver ("Avena, 60 g, 233 kcal"); gráficas con resumen de texto.
- axe sin violaciones serias en Hoy, H1, H2, Progreso, Productos, Ajustes, detalle del TDEE e importación (E2E).

## Icono
Ticket con borde dentado y "kcal" en monoespaciada sobre tinta (`public/icon.svg`; PNG generados con `scripts/build-icons.mjs`).
