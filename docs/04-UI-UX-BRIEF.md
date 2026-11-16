# 04 · UI/UX Design Brief

> Estado: **APROBADO (2026-11-16)** — decisiones abiertas cerradas con la propuesta · Fecha: 2026-11-16 · Depende de: PRD v1.1, TRD v1.1 y App Flow (aprobados) · Contexto de producto: `PRODUCT.md`
> Modo de la superficie: **Operate**. Se trata de completar tareas rápidas y repetidas; la personalidad está en los detalles, no en adornos.

## 1. Trabajo y público
- **Quién:** yo, en el iPhone, con una mano, a menudo con la otra ocupada o con el plato delante. Abro la app 4–8 veces al día durante menos de 30 s y una vez a la semana para revisar el progreso.
- **Qué necesito en cada apertura:** saber **cuánto me queda hoy** y **apuntar algo**, sin pensar.
- **Qué hace única a esta app:** sus números son transparentes. Cada total se puede desglosar y el objetivo solo cambia si lo confirmo.

## 2. Principios
1. **Registrar en menos de 3 toques.** Un favorito se registra con "+" → favorito (2 toques). El camino de búsqueda es "+" → resultado → Añadir. Ninguna acción frecuente pasa por un menú ⋯.
2. **El número manda.** En Hoy, lo primero que se ve son las **kcal restantes**. Todo lo demás queda supeditado.
3. **Cada total se puede desglosar.** Si tocas un total, ves de dónde sale: en el diario, sus renglones; en el TDEE, la fórmula con los valores.
4. **Lo dudoso se marca, no se esconde:** total parcial, estimado, confianza baja, editado tras exportar.
5. **Minimalismo funcional:** ni rachas, ni confeti, ni frases motivadoras, ni ilustraciones decorativas.
6. **Zona del pulgar:** las acciones primarias van en el tercio inferior de la pantalla.

## 3. Dirección visual: **"Ticket de supermercado"**

**Tesis:** cada día es un **ticket de caja**. Las comidas son secciones del ticket, cada alimento es un renglón con su cantidad a la izquierda y sus kcal a la derecha, y al pie va el **TOTAL** frente al objetivo. La app rechaza el aspecto habitual de las apps de fitness: tarjetas con sombra, anillos de colores, gradientes y verde lima.

### 3.1 Mundo propio
- **Material:** papel térmico. Fondo blanco ligeramente cálido en modo claro y una superficie de carbón en modo oscuro (§7). Sin sombras: la profundidad se marca con **líneas de puntos o de guiones** (el corte del ticket) y con filetes de 1 px.
- **Paleta (estrategia sobria):**
  - Tinta: casi negra en claro y casi blanca en oscuro.
  - Tinta secundaria: gris de tinta térmica desvaída, para las etiquetas y los valores de 100.
  - **Un solo color con función de alerta:** el rojo de las líneas de "DESCUENTO" o "TOTAL A PAGAR" de los tickets. Solo se usa cuando te pasas del objetivo, para los errores y para ⚠ revisar. Nunca como decoración.
  - **Un acento de acción:** el azul tinta de un sello de caja. Se usa solo en el botón primario, en el "+" y en el foco.
  - Los macros **no llevan color propio**. Se distinguen por su etiqueta (P / C / G) y por su posición fija, como en un ticket.
- **Tipografía:**
  - **Cifras y renglones:** una monoespaciada de ticket con cifras tabulares, para que todas las cantidades se alineen en columna. Candidatas: JetBrains Mono, Martian Mono o la `ui-monospace` del sistema (SF Mono), que pesa 0 KB.
  - **Interfaz y etiquetas:** la sans del sistema (`-apple-system`, SF Pro), para que la app se lea como nativa y respete Dynamic Type.
  - **Jerarquía por escala:** la cifra de kcal restantes en tamaño de display (unos 56–64 pt) y el resto en 13–17 pt. Cabeceras de sección en VERSALITAS espaciadas, como "DESAYUNO ........ 412".
- **Detalles:**
  - Puntos guía (`........`) entre el nombre y la cifra.
  - Separadores `- - - - -` entre comidas.
  - Cabecera del día al estilo de un ticket: `LUN 16 NOV 2026 · 14:05`.
  - Un pie con `TOTAL`, `OBJETIVO` y `RESTANTE`, alineados a la derecha.

### 3.2 Primera pantalla (T1 Hoy)
```
┌──────────────────────────────────────┐
│ ‹  LUN 16 NOV 2026  ›            ⋯   │  ← cabecera del ticket
│                                      │
│ RESTANTE                             │
│ 1.284 kcal           (display, mono) │
│ ─────────────────────────────── 62 % │  ← barra fina de kcal
│ P  98/150 g ▬▬▬▬▬▬▬░░░               │
│ C 180/260 g ▬▬▬▬▬▬▬░░░               │  ← barras finas, sin color
│ G  41/ 70 g ▬▬▬▬▬▬░░░░               │
│ + fibra · azúcar · sal · sat.        │  ← desplegable
│ - - - - - - - - - - - - - - - - - - -│
│ [!] TDEE 2.450 → 2.380   Revisar ›   │  ← propuesta (resaltada)
│ PESO 78,4 kg · tend. 78,9 · Salud ✓  │
│ - - - - - - - - - - - - - - - - - - -│
│ DESAYUNO ...................... 412 +│
│  Avena 60 g ................... 233  │
│  Leche semidesnatada 250 ml ... 115  │
│ COMIDA ........................ 0   +│
│ ...                                  │
│                                      │
│                              ( + )   │  ← FAB azul tinta, zona del pulgar
│ [ Hoy ][ Progreso ][ Productos ][ ⚙ ]│
└──────────────────────────────────────┘
```

### 3.3 Interacción característica: **"imprimir el renglón"**
Al registrar un alimento, el renglón nuevo **se imprime** en su comida: aparece de arriba abajo en unos 180 ms, como el papel que sale de la impresora. Al mismo tiempo, el TOTAL y el RESTANTE cambian de cifra y el iPhone da una vibración ligera. Con "reducir movimiento" activado, el renglón aparece sin animación.

### 3.4 Préstamos de otras direcciones
- **De la tarjeta de embarque:** un cambio pendiente (la propuesta de TDEE, un producto con ⚠ revisar o un registro editado tras exportar) **queda marcado** en su sitio hasta que lo revisas. Nunca desaparece solo.
- **De la consola oscura:** las acciones destructivas (eliminar, revocar el token, restaurar la copia de seguridad) van **apartadas**, al final y separadas por espacio, con estilo de contorno, y piden confirmación.
- **Riesgo asumido:** la columna estrecha del ticket puede quedarse corta para las gráficas de Progreso. Se resuelve en §4 con gráficas de líneas finas y monocromas, como si el ticket las imprimiera.

## 4. Componentes clave
| Componente | Descripción |
|---|---|
| **Cabecera del ticket** | Fecha en monoespaciada en VERSALITAS, flechas ‹ › para cambiar de día y deslizar lateral, y menú ⋯ (día incompleto, copiar día). |
| **Bloque RESTANTE** | Cifra de display, una barra fina de kcal y las barras de P/C/G con "consumido/objetivo". Al pasarte, la cifra se convierte en **"EXCESO +120"** en rojo, sin animación de alarma. Tocar el bloque muestra el desglose. |
| **Renglón** | Nombre a la izquierda y cantidad con unidad debajo en gris. Las kcal van a la derecha, en tabulares y unidas al nombre por puntos guía. Marcas posibles: `≈` estimado, `⚠` revisar, `½` total parcial. Al tocarlo se abre H2; deslizarlo a la izquierda muestra Eliminar. |
| **Sección de comida** | Cabecera `NOMBRE ........ subtotal` con un "+" propio y separador de guiones. Si está vacía, el renglón dice "— sin registros —". |
| **FAB "+"** | Círculo de 56 px en azul tinta, abajo a la derecha, por encima de la barra de pestañas. |
| **Hoja H1 Añadir** | Hoja inferior que ocupa el 90 % de la pantalla. Arriba, un buscador con el foco puesto y un botón de escáner; debajo, el selector de comida en forma de chip ("→ Comida"), las pestañas Recientes · Favoritos · Comidas guardadas · Recetas y el chip de supermercado. Los favoritos con su última cantidad muestran "↵ 1 toque". |
| **Hoja H2 Cantidad** | Una cifra grande que se puede editar, un selector de unidad o porción (g/ml/porciones), los botones 1× ½ 2× y una tabla en miniatura con kcal, P, C y G en vivo. El botón primario "Añadir 233 kcal" ocupa todo el ancho, en la zona del pulgar. |
| **Visor del escáner** | Pantalla completa con un marco de esquinas, un texto de ayuda y el botón "Escribir código" siempre visible. Al leer un código da una vibración y pasa directamente a H2. |
| **Tarjeta de propuesta** | Fondo invertido (tinta sobre papel al revés) con `[!]`, los valores antes y después, y los botones Aceptar · Rechazar · Detalle. Se queda hasta que respondes. |
| **Tarjeta de peso** | Peso del día, tendencia y origen (Salud ✓ o Manual). Si llevas más de 48 h sin sincronizar, muestra "Salud: sin sincronizar desde…". |
| **Gráficas de Progreso** | Líneas de 1–1.5 px. Los pesos diarios se pintan como puntos grises y la tendencia como una línea de tinta. Rejilla de puntos y ejes en monoespaciada. Sin rellenos ni gradientes. El TDEE se pinta en escalones, con las propuestas rechazadas en línea de guiones. |
| **Ficha de producto (D1)** | Como una etiqueta: la tabla "por 100 g" con filetes, las porciones, los supermercados con su precio, y el origen y las fechas al pie en gris. |
| **Vista previa de importación (D5)** | Lista de "tickets" de producto con sus insignias (⚠, ≈, DUPLICADO) y un selector segmentado Actualizar / Fusionar / Nuevo / Omitir por producto. Barra fija abajo: "Importar 23 · Omitir 2". |
| **Toast** | Una franja de ticket en la parte inferior: "Añadido · Avena 60 g — DESHACER", durante 5 s. |
| **Banner sin conexión** | Una franja fija bajo la cabecera: "SIN CONEXIÓN — no se guardan cambios". |
| **Barra de pestañas** | 4 pestañas con icono y etiqueta. La activa, en tinta y subrayada; las inactivas, en gris. |
| **Iconos** | Un solo set de trazo, Lucide de 1.5 px, para que encaje con los filetes. |

## 5. Estados vacíos, de carga y de error
| Contexto | Contenido |
|---|---|
| Hoy, primer día | Un ticket en blanco con `— ticket vacío —` y "Toca + para apuntar tu primera comida". Una flecha discreta hacia el FAB. |
| Comida vacía | Renglón gris: "— sin registros —". |
| Búsqueda sin resultados locales | "Nada en tu base." y los botones [Buscar en USDA / OFF] y [Crear producto]. |
| Búsqueda externa sin resultados | "Tampoco en USDA ni OFF." y el botón [Crear producto «texto»]. |
| Recientes o favoritos vacíos | "Aún no hay favoritos. Marca ☆ en cualquier producto." |
| Escáner: producto no encontrado | "Código 8410… no está en Open Food Facts." y el botón [Crearlo] con el código ya rellenado. |
| Escáner: permiso de cámara denegado | Cómo activar la cámara en Ajustes de iOS y el botón [Escribir código]. |
| Progreso sin datos suficientes | "El TDEE adaptativo empieza tras 14 días con 10 días registrados y 7 pesajes. Llevas X / Y / Z." Muestra el progreso, nunca un gráfico vacío. |
| Semana sin propuesta | Historial: "Semana 46 · sin ajuste · solo 3 días registrados". |
| Importación con JSON inválido | Error en monoespaciada con la ruta del campo (`products[3].nutrients_per_100.energy_kcal: debe ser número`) y el texto conservado para corregirlo. |
| Carga | Renglones esqueleto con rayas grises del ancho del texto. Nunca un spinner a pantalla completa en Hoy. |
| Error al guardar | Toast en rojo, "No se guardó · REINTENTAR", y el renglón optimista se retira. |
| Sin conexión | El banner fijo y los botones de guardar desactivados con su motivo. |
| Total parcial | Una marca `½` junto al total y "Algunos productos no tienen fibra." al tocarla. |

**Tono de los textos:** español de España, tuteo, frases cortas y en impersonal donde encaje. Sin exclamaciones ni emojis, cifras con el formato local (`1.284`, `78,4`) y unidades siempre visibles.

## 6. Accesibilidad
- **WCAG 2.1 AA:**
  - la tinta y el acento tienen un contraste de al menos 4.5:1 sobre el papel en los dos modos;
  - el gris secundario, al menos 4.5:1 en el texto y 3:1 en las líneas de las gráficas;
  - el rojo nunca es el único indicador: el exceso también se marca con el texto "EXCESO" y con el signo +.
- **Objetivos táctiles de 44×44 pt o más**, incluidos los "+" de cada comida y los chips. Los renglones miden al menos 48 pt de alto.
- **Dynamic Type:** la interfaz usa `rem` y la fuente de texto del sistema. La cifra de display tiene un tope para no romper la cabecera. Se prueba con el tamaño de letra al 200 %.
- **VoiceOver:**
  - los renglones se leen como "Avena, 60 gramos, 233 kilocalorías";
  - las barras tienen `role="progressbar"` con su valor y su máximo;
  - las gráficas llevan un resumen en texto ("Tendencia: −0,4 kg en 7 días");
  - el contenido de los toasts se anuncia en una región `aria-live` con prioridad `polite`.
- **Foco visible** con un contorno de 2 px en azul tinta y un orden de foco lógico en las hojas. Las hojas se cierran con el botón Cerrar y deslizando hacia abajo, que no es la única forma de cerrarlas.
- **Movimiento:** se respeta `prefers-reduced-motion`.
- **Teclado numérico** (`inputmode="decimal"`) para las cantidades y los pesos, aceptando la coma decimal.

## 7. Modo oscuro
- Sigue al sistema (`prefers-color-scheme`), con la opción en Ajustes: Sistema / Claro / Oscuro.
- **Oscuro = papel carbón:** el fondo es de un gris carbón cálido, no negro puro (para evitar el *smearing* en las pantallas OLED). La tinta es de un blanco roto cálido y el gris secundario se ajusta para mantener el contraste de 4.5:1.
- El rojo de alerta y el azul tinta se aclaran un paso en oscuro para conservar el contraste. Los filetes y los guiones bajan de opacidad.
- La tarjeta de propuesta invertida también se invierte en oscuro: papel claro con tinta oscura.
- La `theme-color` de la PWA cambia con el modo, para que la barra de estado de iOS combine.
- Todos los colores se definen como tokens (`--paper`, `--ink`, `--ink-2`, `--rule`, `--alert`, `--action`) en `:root` y se redefinen para el modo oscuro. Ningún color va escrito directamente en un componente.

## 8. Diseño y comportamiento responsive
- **Diseño mobile-first a 390 pt** (iPhone de 6,1"). En pantallas de 360 pt o menos, la cifra de display se reduce.
- **Áreas seguras:** se usa `env(safe-area-inset-*)` para la isla dinámica y para el indicador de inicio.
- **Escritorio:** el ticket se centra con un ancho máximo de unos 480 px. En Progreso, la columna se amplía hasta unos 720 px solo para las gráficas.
- **Gestos:** deslizar para cambiar de día en Hoy, deslizar un renglón para eliminarlo y deslizar hacia abajo para cerrar las hojas. Ningún gesto es la única forma de hacer algo.

## 9. Movimiento y sensación táctil (mínimas)
- **Duraciones:** entre 120 y 200 ms, con *ease-out* para entrar y *ease-in* para salir.
- **Hojas:** suben desde abajo en 200 ms.
- **Firma propia:** "imprimir el renglón" (§3.3). Las cifras **no cuentan**: cambian al instante, porque la precisión importa más.
- **Vibración:** una vibración ligera al registrar y al leer un código de barras, nada más. En la web de iOS la vibración no siempre está disponible; si no lo está, no se sustituye por nada.
- **Con reducir movimiento:** sin desplazamientos y solo fundidos de 0–100 ms.

## Decisiones abiertas
1. **Fuente de las cifras:** JetBrains Mono, Martian Mono o la `ui-monospace` del sistema (SF Mono, que pesa 0 KB). Propuesta: **SF Mono del sistema**, con JetBrains Mono como respaldo en escritorio y Android.
2. **Tonos exactos de la paleta** (el papel, el carbón, el rojo y el azul tinta): se fijan y se validan con un comprobador de contraste en la primera tarea de implementación (Implementation Plan) y se documentan en `DESIGN.md` al terminar.
3. **Borde dentado** en la parte superior del ticket: ¿se usa como detalle? Propuesta: **solo en la cabecera de Hoy**, como imagen SVG pequeña, nunca como `clip-path`.
4. **Icono de la app y pantalla de inicio de la PWA:** propuesta de un ticket con la cifra "kcal" en monoespaciada.

## Supuestos
- El navegador de iOS en una PWA instalada respeta `prefers-color-scheme`, `prefers-reduced-motion` y las áreas seguras.
- Las fuentes del sistema (SF Pro y SF Mono) están disponibles en iOS mediante `-apple-system` y `ui-monospace`.
- La metáfora del ticket funciona también en Productos y en Ajustes como lista de renglones, sin forzarla: allí basta con la tipografía y los filetes.
- Las gráficas de Progreso se dibujan con Recharts y se personalizan para lograr el estilo de línea fina monocroma.
