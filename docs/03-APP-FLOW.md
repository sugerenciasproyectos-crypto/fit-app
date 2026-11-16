# 03 · App Flow

> Estado: **APROBADO (2026-11-16)** — decisiones abiertas cerradas con la propuesta · Fecha: 2026-11-16 · Depende de: PRD v1.1 y TRD v1.1 (aprobados)

## 1. Inventario de pantallas

| ID | Pantalla | Tipo | Requisitos |
|---|---|---|---|
| P0 | Login | Pantalla | M11 |
| P1 | Onboarding 1 · Perfil | Pantalla | M1 |
| P2 | Onboarding 2 · Objetivo y macros | Pantalla | M1, S4 |
| P3 | Onboarding 3 · Extras opcionales (Salud e importar productos) | Pantalla | M12, M15 |
| **T1** | **Hoy** (diario) | Pestaña | M6, M7, M8, M10 |
| **T2** | **Progreso** | Pestaña | M9, M10, S3 |
| **T3** | **Productos** | Pestaña | M2, M13, M14, S1, S2, S7 |
| **T4** | **Ajustes** | Pestaña | M1, M12, S9 |
| H1 | Añadir (hoja de búsqueda unificada) | Hoja | M3, M13, S2, S5, S7 |
| H2 | Cantidad | Hoja | M5, M6, M16 |
| H3 | Escáner | Pantalla completa | M4 |
| H4 | Peso del día | Hoja | M8 |
| H5 | Propuesta de TDEE (detalle) | Hoja | M10 |
| D1 | Ficha y edición de producto | Pantalla | M14, M16, S7 |
| D2 | Editor de receta | Pantalla | S1 |
| D3 | Editor de comida guardada | Pantalla | S2 |
| D4 | Importar JSON: entrada | Pantalla | M15, S9 |
| D5 | Importar JSON: vista previa y conflictos | Pantalla | M15 |
| D6 | Supermercados | Pantalla | S7 |
| D7 | Salud: token y guía del atajo | Pantalla | M12, S8 |
| D8 | Copia de seguridad y exportar | Pantalla | S9 |
| D9 | Comidas del día (configurar las franjas) | Pantalla | M6 |
| D10 | Perfil y objetivo (editar) | Pantalla | M1 |
| D11 | Acerca de y atribuciones (ODbL) | Pantalla | TRD §6.1 |

## 2. Mapa de navegación

```mermaid
flowchart TD
  P0[P0 Login] -->|sin perfil| P1[P1 Perfil] --> P2[P2 Objetivo y macros] --> P3[P3 Extras opcionales] --> T1
  P0 -->|con perfil| T1

  subgraph Tabs[Barra inferior]
    T1[T1 Hoy]
    T2[T2 Progreso]
    T3[T3 Productos]
    T4[T4 Ajustes]
  end

  T1 -->|+ flotante / + de comida| H1[H1 Añadir]
  T1 -->|tarjeta peso| H4[H4 Peso del día]
  T1 -->|tarjeta propuesta| H5[H5 Propuesta TDEE]
  T1 -->|tocar registro| H2
  H1 -->|elegir producto| H2[H2 Cantidad]
  H1 -->|icono escáner| H3[H3 Escáner]
  H1 -->|favorito con última cantidad: 1 toque| T1
  H1 -->|comida guardada| T1
  H3 -->|encontrado| H2
  H3 -->|no encontrado| D1
  H2 -->|Añadir| T1

  T2 --> H4
  T2 --> H5

  T3 --> D1[D1 Producto]
  T3 --> D2[D2 Receta]
  T3 --> D3[D3 Comida guardada]
  T3 --> D4[D4 Importar JSON]
  T3 --> D6[D6 Supermercados]
  D4 --> D5[D5 Vista previa]
  D5 -->|guardar| T3

  T4 --> D10[D10 Perfil y objetivo]
  T4 --> D9[D9 Comidas del día]
  T4 --> D7[D7 Salud / atajo]
  T4 --> D8[D8 Backup / exportar]
  T4 --> D11[D11 Acerca de]
  D8 -->|restaurar| D4
  T4 -->|Sincronizar con Salud| SC((Atajo iOS))
  SC -.->|vuelve a la PWA| T1
```

## 3. Contenido de las pantallas principales

**T1 Hoy**
- Cabecera: selector de fecha (‹ hoy ›) y menú ⋯ con "Marcar día incompleto" y "Copiar día…".
- Resumen: kcal consumidas y restantes, y barras de proteína, carbohidratos y grasa. Fibra, azúcar, sal y grasa saturada se pliegan en "más".
- Tarjeta de propuesta de TDEE, solo si hay una pendiente.
- Tarjeta de peso del día (origen: Salud o manual) y los pasos de hoy como contexto.
- Una sección por cada comida configurada, con su subtotal, sus registros y un "+" propio.
- Botón "+" flotante.

**T2 Progreso**
- Rango: 30 días, 90 días o todo.
- Gráfica del peso con su tendencia y el ritmo en kg por semana.
- Gráfica del TDEE (estimado y propuestas) y el historial de propuestas.
- Adherencia: días registrados por semana.
- Pasos y kcal activas, marcados como informativos.
- Lista de pesos, que se pueden editar y borrar.

**T3 Productos**
- Buscador con filtros: favoritos, supermercado, origen y "⚠ revisar".
- Segmentos: Productos · Recetas · Comidas guardadas.
- Acciones: + Nuevo producto · Escanear · Importar JSON · Supermercados.

**T4 Ajustes**
- Perfil y objetivo · Comidas del día · Salud (token, guía y "Sincronizar ahora") · Copia de seguridad y exportar · Cuenta (cerrar sesión) · Acerca de.

## 4. Flujos principales

### 4.1 Onboarding (primera vez)

```mermaid
sequenceDiagram
  actor U as Yo
  participant A as App
  participant DB as Supabase
  U->>A: Login (email + contraseña)
  A->>DB: ¿existe perfil?
  DB-->>A: no
  A->>U: P1 Perfil (sexo, nacimiento, altura, peso, actividad)
  U->>A: Siguiente
  A->>U: P2 Objetivo (perder/mantener/ganar + ajuste) y vista de TMB, TDEE, kcal y macros (editables) + Katch opcional
  U->>A: Siguiente
  A->>DB: guarda perfil, objetivo, TDEE_0, peso inicial y comidas por defecto
  A->>U: P3 Extras: [Configurar Salud] [Importar productos] [Saltar]
  U->>A: Saltar o completar
  A->>U: T1 Hoy (vacío)
```
- Validaciones: edad de 14 a 100 años, altura de 120 a 230 cm y peso de 30 a 300 kg.
- Si cierras la app a mitad, el onboarding se retoma en el último paso que no completaste.
- Comidas por defecto: Desayuno · Comida · Merienda · Cena · Snacks. Se pueden editar en D9.

### 4.2 Registrar comida (camino rápido)

```mermaid
flowchart TD
  A[T1 Hoy] -->|"+ flotante (comida por hora) o + de una comida"| B[H1 Añadir]
  B --> C{¿Qué toco?}
  C -->|Favorito/Reciente con última cantidad| Z[Registrado con 1 toque + toast 'Deshacer']
  C -->|Comida guardada| Z2[Se añaden todos sus ítems + toast 'Deshacer']
  C -->|Producto / resultado de búsqueda| D[H2 Cantidad]
  C -->|Sin resultados locales| E[Buscar en USDA / OFF]
  E -->|elijo resultado| F[Se guarda en caché] --> D
  E -->|nada| G[Crear producto manual D1] --> D
  D -->|unidad g/ml o porción, 1× ½ 2×, totales en vivo| H[Añadir]
  H --> I[Snapshot de nutrientes guardado, totales actualizados] --> A
  Z --> A
  Z2 --> A
```
- **Comida por hora** (editable en D9): Desayuno antes de las 11:00, Comida de 11:00 a 16:00, Merienda de 16:00 a 19:30, Cena después de las 19:30. Snacks solo se elige a mano. En H1 hay un selector de comida en la cabecera.
- **Conteo de toques:** "+" → favorito = **2 toques**. "+" → buscar → resultado → Añadir = 3 toques más lo que escribas.
- **Editar un registro:** tocarlo en Hoy abre H2 con sus valores, con las opciones Guardar, Mover a otra comida y Eliminar.

### 4.3 Escanear un código de barras

```mermaid
flowchart TD
  A[H1 Añadir] -->|icono escáner| B[H3 Escáner: pedir cámara]
  B -->|permiso denegado| B1[Mensaje + 'Introducir código a mano']
  B -->|lee EAN| C{¿En caché local?}
  B1 -->|código escrito| C
  C -->|sí| H[H2 Cantidad]
  C -->|no| D[food-lookup → OFF]
  D -->|status 1, datos completos| E[Guardar en caché] --> H
  D -->|status 1, incompleto o incoherente| F[D1 en modo 'completar', con ⚠ revisar] --> H
  D -->|status 0 / error| G[D1 nuevo con el código prellenado] --> H
  D -->|stores de OFF| S[Sugerir supermercados en D1]
```
- Si la detección tarda más de 10 s, aparece la opción "¿Problemas? Escribe el código".

### 4.4 Crear una receta

```mermaid
flowchart TD
  A[T3 Productos → Recetas → +] --> B[D2 Editor: nombre]
  B --> C[Añadir ingrediente → H1 en modo selección → H2 cantidad]
  C --> B
  B --> D[Opcional: peso final cocinado / nº raciones]
  D --> E[Vista en vivo: totales, por 100 g, por ración]
  E -->|Guardar| F[Producto derivado source=receta + porción 'ración']
  F --> G[Disponible en H1 pestaña Recetas]
```
- Para editar la receta se vuelve a D2. Al guardar, se recalcula el producto derivado y se ofrece **"aplicar corrección a registros anteriores"**, igual que en 4.7.

### 4.5 Registrar el peso

```mermaid
flowchart TD
  subgraph Auto[Automático]
    S1[Automatización 23:30 o botón 'Sincronizar'] --> S2[Atajo lee Salud 7 días] --> S3[health-sync: dedupe, peso del día]
  end
  subgraph Manual
    M1[T1 tarjeta peso / T2 + peso] --> M2[H4: kg + fecha] --> M3[Guardar como manual: manda sobre Salud]
  end
  S3 --> R[Recalcular EMA desde la fecha más antigua afectada]
  M3 --> R
  R --> T[T1 tarjeta muestra peso, tendencia y origen]
```

### 4.6 Ver el progreso y la propuesta semanal del TDEE

```mermaid
flowchart TD
  A[Abrir app] --> B{¿Semana cerrada sin evaluar?}
  B -->|no| T1[T1 Hoy]
  B -->|sí| C{¿Cumple arranque y ≥5 días + pesaje?}
  C -->|no| N[Guardar 'sin ajuste' + motivo en historial] --> T1
  C -->|sí| D[Calcular propuesta TRD §7.7] --> E[Tarjeta en T1]
  E -->|Aceptar| F[tdee y objetivo actualizados, macros recalculados]
  E -->|Rechazar| G[Se mantiene, queda en historial]
  E -->|Ver detalle| H[H5: kcal_media, Δtendencia, tdee_obs, límite aplicado]
  H --> F
  H --> G
  T2[T2 Progreso] --> H
```
- Si hay varias semanas sin evaluar (por ejemplo, tras una semana sin abrir la app), se evalúan en orden y **solo se muestra la última propuesta válida**. Las anteriores quedan como "caducadas" en el historial.

### 4.7 Editar un producto (con corrección retroactiva)

```mermaid
flowchart TD
  A[D1 Producto] -->|Editar| B[Todos los campos editables]
  B -->|Guardar| C[manually_edited = true, updated_at]
  C --> D{¿Cambiaron nutrientes y hay registros que lo usan?}
  D -->|no| E[Fin]
  D -->|sí| F["Diálogo: 'N registros usan este producto. ¿Aplicar corrección?' (rango de fechas, Δ kcal)"]
  F -->|Solo futuros| E
  F -->|Aplicar| G[Recalcular snapshots → marcar export_dirty si ya exportados] --> E
```

### 4.8 Importar productos desde IA o restaurar una copia de seguridad

```mermaid
flowchart TD
  A[T3 Importar JSON / P3 / D8 Restaurar] --> B[D4: pegar texto o abrir .json]
  B --> C{Validación Zod}
  C -->|JSON inválido| C1[Error con línea/causa] --> B
  C -->|válido| D{¿Solo products?}
  D -->|sí| E[D5 Vista previa editable]
  D -->|no: backup| R[Resumen por tabla + confirmar restauración] --> X[Transacción] --> T3
  E --> F[Insignias ⚠ confidence baja / estimado / incoherente + warnings]
  E --> G[Duplicados: Actualizar / Fusionar / Crear nuevo / Omitir · 'aplicar a todos']
  E --> H[Supermercados nuevos: confirmar creación]
  F & G & H --> I{¿Quedan errores?}
  I -->|sí| E
  I -->|no| J[Importar seleccionados en transacción] --> K[Resumen: creados/actualizados/omitidos] --> T3[T3 Productos]
```

### 4.9 Sincronizar con Apple Salud

```mermaid
sequenceDiagram
  actor U as Yo
  participant A as PWA
  participant S as Atajo iOS
  participant H as Apple Salud
  participant F as health-sync
  U->>A: T4 / T1 "Sincronizar con Salud"
  A->>S: shortcuts://run-shortcut?name=Sync Salud
  S->>H: leer peso, pasos y energía activa (7 días)
  S->>F: POST samples + ack_exported (Bearer token)
  F-->>S: resumen de lo importado + to_export
  S->>H: registrar las muestras de nutrición
  S->>A: vuelve a la PWA (abrir URL)
  A->>A: refrescar datos y mostrar el toast "Salud: 1 peso, 7 días de pasos, 4 comidas exportadas"
```
- **Configuración inicial (D7):** generar el token → copiarlo → seguir la guía paso a paso → "Probar conexión". La app muestra la fecha de la última sincronización recibida.

### 4.10 Copia de seguridad y exportación
D8 → **Exportar JSON completo** (descarga) · **Exportar CSV (.zip)** · **Restaurar desde JSON** (lleva a D4) · Muestra la fecha de la última exportación y un recordatorio si han pasado más de 30 días.

## 5. Estados transversales
| Situación | Comportamiento |
|---|---|
| Sin red | Banner fijo "Sin conexión: no se pueden guardar cambios". Las acciones de guardar se desactivan y la vista actual se mantiene. |
| Sesión caducada | Redirige a P0 y vuelve a la misma pantalla tras el login. |
| Error al guardar | Toast con "Reintentar". La actualización optimista se revierte. |
| Deshacer | Toast de 5 s tras registrar o borrar. |
| Token de Salud revocado | En D7, "El atajo dejará de funcionar" y un botón para regenerarlo. |
| Sin sincronizar con Salud más de 48 h | Aviso discreto en la tarjeta de peso de T1. |

## Decisiones abiertas
1. Horas límite de cada comida por hora (propuestas en 4.2).
2. Tiempo para el recordatorio de copia de seguridad (propuesta: 30 días).
3. Al rechazar una propuesta de TDEE, ¿se pide el motivo? (propuesta: no).

## Supuestos
- Al final del atajo, una acción "Abrir URL" puede devolver al usuario a la PWA instalada.
- La pestaña Hoy concentra el 90 % del uso diario.
- El selector de fecha permite registrar en días pasados y en el futuro inmediato (planificar el día). No hay un límite.
