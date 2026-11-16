# 06 · Implementation Plan

> Estado: **APROBADO (2026-11-16)** — decisiones abiertas cerradas con la propuesta · Fecha: 2026-11-16 · Depende de: documentos 01–05 (aprobados)

## 0. Cómo trabajamos
| Aspecto | Decisión |
|---|---|
| Dedicación | 5–8 h a la semana. Cada tarea dura **1–3 h** y cabe en una sesión. |
| Quién programa | **Tú.** Yo te guío en cada tarea (te explico el enfoque, te doy pistas y te resuelvo dudas) y reviso cada PR. |
| Repositorio | GitHub privado. Una rama por tarea (`f3/t3.2-busqueda-local`) y una PR con la CI en verde y mi revisión antes de fusionar en `main`. |
| Despliegue | Cloudflare Pages despliega `main` en producción y cada PR en una URL de previsualización. |
| Entornos | **Dos proyectos de Supabase en la nube con plan gratuito: `calorias-dev` y `calorias-prod`** (sin Docker; ver la nota). Las migraciones se aplican con `supabase db push`, primero a dev y, al fusionar, a prod. |
| Licencia | Todos los derechos reservados (`LICENSE` ya creado). `package.json` lleva `"license": "UNLICENSED"`. Commits sin firma. |

> **Nota de coherencia:** el TRD §9 decía "entorno local con `supabase start`". Al elegir no usar Docker (3b), lo sustituyo por un **segundo proyecto de Supabase (dev)**. El plan gratuito permite 2 proyectos activos, así que el coste sigue siendo 0 €. Los tests de RLS y RPC se ejecutan contra `calorias-dev`. Si apruebas este plan, actualizo esa línea del TRD.

**Definición de hecho (para cada tarea):**
1. Se cumplen los criterios de aceptación.
2. Lint, typecheck y tests en verde en la CI.
3. Los tests nuevos cubren la lógica nueva.
4. Funciona en Safari de iPhone, en la URL de previsualización.
5. Si cambia el esquema, la migración está aplicada en dev.
6. PR revisada.

## 1. Estrategia de tests
| Nivel | Herramienta | Alcance | Objetivo |
|---|---|---|---|
| Unitario | Vitest | `src/domain/` (fórmulas) y `packages/schemas/` (Zod) | **100 % de líneas y ramas.** Casos con los valores de ejemplo del TRD y los límites. |
| Componentes | Vitest + Testing Library | Hojas H1 y H2, bloque RESTANTE, renglón y vista previa de importación | Estados: vacío, carga, error, parcial y exceso. |
| Base de datos | Vitest + `supabase-js` contra `calorias-dev` | RLS (un usuario B no ve nada de A), RPC (`import_products`, `apply_product_correction`, `search_products`) y triggers | Cada RPC con su caso feliz y sus casos de error. |
| Edge Functions | `deno test` | `food-lookup` (normalización de OFF y USDA con fixtures JSON reales) y `health-sync` (dedupe y peso del día) | Fixtures de `status: 0`, kJ, solo por ración e incoherente. |
| E2E | Playwright (WebKit, viewport de iPhone) | 6 flujos: onboarding, registrar desde la búsqueda, registrar un favorito en 2 toques, escanear con un código simulado, importar JSON y aceptar una propuesta de TDEE | Contra la previsualización con dev. |
| Accesibilidad | `@axe-core/playwright` dentro de los E2E | Hoy, H1, H2, Progreso y D5 | 0 violaciones serias o críticas. |
| Ida y vuelta | Vitest | exportar → importar sobre una base vacía → exportar | Los dos JSON son idénticos (normalizados). |

La CI (GitHub Actions) ejecuta en cada PR lint, typecheck, unitarios, componentes, `deno test` y build. Los tests de base de datos y los E2E se ejecutan en cada PR que toca `supabase/`, `src/` o `e2e/`, con los secretos de dev.

## 2. Fases y tareas

Formato: **T** (tarea) · ⏱ (estimación) · ✅ (criterios de aceptación).

---

### Fase 0 · Cimientos (unas 10 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 0.1 | Crear el repositorio en GitHub, `git init`, `.gitignore`, `LICENSE`, `README`, y copiar `docs/` y `PRODUCT.md` | 1 h | El repositorio privado existe con los 6 documentos. |
| 0.2 | Andamiaje: Vite, React, TS strict, Tailwind, ESLint, Prettier, Vitest y la estructura `src/{domain,features,ui,lib}` y `packages/schemas` | 2 h | `npm run dev`, `test`, `lint` y `typecheck` pasan en limpio. |
| 0.3 | CI de GitHub Actions (lint, typecheck, test, build) | 1 h | Una PR de prueba muestra los checks en verde. |
| 0.4 | Crear `calorias-dev` y `calorias-prod` en Supabase, `supabase init` y enlazar la CLI | 1 h | `supabase db push` funciona contra dev. |
| 0.5 | Migración `0001_init.sql` (Backend Schema §4) y generar los tipos de TS | 2 h | Se aplica sin errores en dev. `src/lib/db.types.ts` está generado. |
| 0.6 | Cloudflare Pages: despliegue de `main` y de las previsualizaciones, con las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` | 1 h | La URL de producción sirve "hola" por HTTPS en el iPhone. |
| 0.7 | Tokens de diseño: `--paper`, `--ink`, `--ink-2`, `--rule`, `--alert` y `--action` en claro y oscuro, validados con un comprobador de contraste (Design Brief, decisión abierta 2), y las pilas de fuentes del sistema | 2 h | Una página `/dev/tokens` muestra la paleta en los dos modos con contraste ≥ 4.5:1 comprobado por un test. |

**Al terminar la fase:** el esqueleto desplegado, la base creada y la CI funcionando. Todavía no hay nada usable.

---

### Fase 1 · Dominio puro (unas 10 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 1.1 | `domain/energy.ts`: TMB Mifflin y Katch, TDEE_0, objetivo con suelo y macros (TRD §7.1–7.3) | 2 h | Tests con los ejemplos del TRD y los límites (suelo de 1.500/1.200 kcal, carbohidratos ≥ 0). Cobertura del 100 %. |
| 1.2 | `domain/nutrition.ts`: nutrientes de un registro, porciones, totales con `null` y marca de total parcial (§7.4) | 2 h | `null` se propaga y no cuenta como 0. Funciona con ml. |
| 1.3 | `domain/trend.ts`: EMA con α = 0.1, huecos y recálculo desde una fecha (§7.6), y el ritmo semanal (§7.8) | 2 h | Una serie con huecos da los mismos valores que una hoja de cálculo de referencia. |
| 1.4 | `domain/adaptive.ts`: evaluación semanal (arranque, menos de 5 días, sin pesaje, límite de ±150, suelo y semanas caducadas) (§7.7) | 3 h | Tabla de casos: arranque no cumplido, semana sin ajuste, ajuste limitado, varias semanas pendientes → solo la última. |
| 1.5 | `packages/schemas`: esquema Zod del formato de intercambio v1, con la coma decimal admitida y las claves desconocidas como aviso | 2 h | Valida el ejemplo del usuario. Los errores llevan la ruta (`products[3]...`). |

**Al terminar la fase:** el núcleo de cálculo, 100 % probado. Se puede usar desde la consola o los tests.

---

### Fase 2 · Acceso y perfil (unas 9 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 2.1 | Cliente de Supabase, TanStack Query, React Router y el *layout* con la barra de 4 pestañas y las áreas seguras | 2 h | Navegación entre las 4 pestañas vacías en el iPhone. |
| 2.2 | P0 Login con email y contraseña, sesión persistente y la ruta protegida. Crear tu cuenta y **desactivar el registro** en el panel | 1.5 h | Sin sesión redirige a P0. Un registro nuevo devuelve un error. |
| 2.3 | Onboarding P1–P3 (sin las acciones de Salud ni de importación, que se enlazan más tarde). Guarda el perfil y el peso inicial | 3 h | Al terminarlo, el perfil y las 5 comidas existen en la base (trigger). Si cierras a mitad, retoma en el paso pendiente. |
| 2.4 | D10 Editar perfil y objetivo, con la vista en vivo de TMB, TDEE, kcal y macros | 1.5 h | Al cambiar la actividad, el objetivo se recalcula en pantalla. |
| 2.5 | Test RLS-1: un usuario B no puede leer ni escribir datos de A en ninguna tabla | 1 h | Test verde en dev. |

**Al terminar la fase:** puedes entrar, configurar tu perfil y ver tu objetivo diario.

---

### Fase 3 · Productos y búsqueda local (unas 12 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 3.1 | `scripts/build-seed.ts`: unos 150 alimentos básicos de USDA traducidos, con sus porciones, en la migración `0003_seed_products.sql` | 3 h | Al dar de alta un usuario se copian unos 150 productos y sus porciones. |
| 3.2 | RPC `search_products` (trigram, marca y código de barras) y su test | 2 h | "yogur hacendado" encuentra el producto. 300 ms o menos en dev. |
| 3.3 | T3 Productos: buscador, segmentos y filtros (favoritos, origen, ⚠) | 2 h | La lista se filtra y el estado vacío coincide con el Design Brief. |
| 3.4 | D1 Ficha y edición de producto: todos los campos y las porciones. `manually_edited` y la insignia de origen | 3 h | Al editar se guarda `manually_edited = true`. Las validaciones de la base se muestran como errores de campo. |
| 3.5 | Crear un producto a mano, en ml y en g, con borrado lógico | 2 h | Un producto borrado desaparece de las búsquedas pero sigue en los registros antiguos. |

**Al terminar la fase:** una base de productos navegable y editable.

---

### Fase 4 · Diario: el MVP diario (unas 14 h) ⭐
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 4.1 | T1 Hoy: cabecera del ticket, cambio de día (flechas y deslizar) y secciones por comida con subtotales | 3 h | Muestra el día en Europe/Madrid. Los días vacíos dicen "— sin registros —". |
| 4.2 | Bloque RESTANTE: cifra, barra de kcal, P/C/G, micronutrientes desplegables, EXCESO en rojo y la marca de total parcial | 2 h | Tests de componente para los estados normal, exceso y parcial. |
| 4.3 | H1 Añadir: búsqueda local y selector de comida por hora | 2 h | "+" a las 14:00 propone Comida. El "+" de una sección fuerza esa comida. |
| 4.4 | H2 Cantidad: unidad o porción, 1× ½ 2×, totales en vivo y guardado con **snapshot** | 3 h | El registro guarda `per100` y los 8 valores. Editar el producto después no cambia el registro. |
| 4.5 | Editar, mover y eliminar un registro (deslizar), con toast y Deshacer y actualización optimista con *rollback* | 2 h | Deshacer restaura el registro. Un error de red revierte el cambio y muestra "Reintentar". |
| 4.6 | "Imprimir el renglón" (180 ms, reducir movimiento) y la vibración al registrar | 1 h | Con reducir movimiento activado, aparece sin animación. |
| 4.7 | Marcar el día como incompleto (menú ⋯), banner sin conexión y E2E-1 "registrar desde la búsqueda" | 1 h | E2E verde en WebKit. |

**Al terminar la fase:** ✅ **la app ya sirve para registrar a diario con el objetivo fijo.** Empieza a usarla en la vida real desde aquí.

---

### Fase 5 · Peso, tendencia y TDEE adaptativo (unas 12 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 5.1 | H4 Peso del día (manual) y tarjeta de peso en Hoy | 2 h | Al guardar, se hace *upsert* con `source = manual`. |
| 5.2 | T2 Progreso: gráfica del peso con su tendencia (estilo ticket), selector de rango y lista editable | 3 h | Coincide con `domain/trend`. El resumen de texto para VoiceOver está presente. |
| 5.3 | Evaluación semanal al abrir la app, `tdee_proposals` (incluidas `skipped` y `expired`) y el estado de arranque en Progreso | 3 h | Con datos sintéticos de 3 semanas genera la propuesta correcta, y solo una pendiente. |
| 5.4 | Tarjeta de propuesta (persistente) y H5 Detalle: aceptar o rechazar, recalcular el objetivo y los macros | 2 h | Al aceptar cambia `tdee_current` y el RESTANTE de hoy. Al rechazar no cambia nada. |
| 5.5 | Gráfica del TDEE en escalones, adherencia y E2E-6 "aceptar propuesta" | 2 h | E2E verde. |

**Al terminar la fase:** ✅ **el diferenciador clave funciona:** objetivo adaptativo con confirmación.

---

### Fase 6 · Escáner y APIs externas (unas 12 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 6.1 | Edge Function `food-lookup` con barcode y OFF: `status`, normalización kJ/kcal y por ración, `base_unit`, coherencia y User-Agent | 3 h | `deno test` verde con 6 fixtures (incluidos `status: 0`, solo kJ, solo por ración e incoherente). |
| 6.2 | `food-lookup` con búsqueda en USDA: mapeo por `nutrientNumber`, sodio a sal, clave en los *secrets* y contador de 900 peticiones por hora | 2 h | Tests con fixtures. La clave no aparece en el bundle (comprobado con `grep`). |
| 6.3 | Caché: *upsert* por `source` y `source_id`, refresco a los 90 días y respeto a `manually_edited` | 1.5 h | Test: un producto editado a mano no cambia al volver a consultarlo. |
| 6.4 | H3 Escáner: `@zxing/browser` o `BarcodeDetector`, permisos, "Escribir código" y la vibración al leer | 3 h | En el iPhone, un EAN real se lee en menos de 2 s. Con el permiso denegado muestra el estado del Design Brief. |
| 6.5 | Integrar la búsqueda externa en H1 ("Buscar en USDA / OFF"), el modo "completar" de D1 y los supermercados sugeridos de OFF | 1.5 h | Sin resultados locales → resultados externos → elegir uno lo guarda en la caché y abre H2. |
| 6.6 | D11 Acerca de, con la atribución ODbL, y E2E-4 "escanear" con un código simulado | 1 h | E2E verde. |

**Al terminar la fase:** puedes escanear cualquier producto del súper o buscarlo fuera.

---

### Fase 7 · Velocidad: favoritos, recientes y comidas guardadas (unas 9 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 7.1 | Marcar favorito (☆) en productos, y `last_used_at`, `last_quantity` y `last_portion_id` al registrar | 1.5 h | Los campos se actualizan al registrar. |
| 7.2 | Pestañas Recientes y Favoritos en H1, con el registro de **1 toque** con la última cantidad | 2 h | **E2E-3: un favorito se registra en 2 toques desde Hoy.** |
| 7.3 | D3 Editor de comida guardada, y registrarla desde H1 (todos sus ítems y un único toast con Deshacer) | 3 h | Deshacer retira todos los ítems. |
| 7.4 | Copiar una comida o un día anterior (menú ⋯) | 1.5 h | Copia con el snapshot nuevo, recalculado con los valores actuales del producto. |
| 7.5 | Medir el tiempo de registro de un alimento habitual (cronómetro manual, 10 intentos) | 1 h | La mediana está por debajo de 15 s (métrica del PRD). |

**Al terminar la fase:** el registro habitual es tan rápido como pide la métrica del PRD.

---

### Fase 8 · Importación desde IA y supermercados (unas 13 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 8.1 | D6 Supermercados (CRUD) y la relación N:M con precio en D1 | 2 h | Los nombres son únicos sin distinguir mayúsculas ni tildes. |
| 8.2 | Filtro por supermercado en H1, T3 y favoritos | 1.5 h | El filtro reduce los resultados correctamente. |
| 8.3 | D4 Entrada: pegar texto o abrir un archivo `.json`, validar con Zod y mostrar los errores con su ruta | 2 h | Un JSON inválido conserva el texto y muestra el error. Límite de 5 MB y 2.000 productos. |
| 8.4 | Detección de duplicados (código de barras, o nombre y marca normalizados) y la RPC `import_products` en una transacción | 3 h | Test de base de datos: actualizar, fusionar, nuevo y omitir se comportan según el TRD §8.2. Un fallo a mitad no deja nada guardado. |
| 8.5 | D5 Vista previa editable: insignias (⚠, ≈, DUPLICADO), warnings, acción por producto con "aplicar a todos" y confirmar los supermercados nuevos | 3 h | 200 productos se muestran en menos de 1 s. |
| 8.6 | Enlace desde P3 del onboarding y E2E-5 "importar JSON" | 1.5 h | E2E verde con el JSON de ejemplo del usuario. |

**Al terminar la fase:** puedes llenar tu base con productos generados con IA y organizarlos por supermercado.

---

### Fase 9 · Recetas y corrección retroactiva (unas 8 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 9.1 | D2 Editor de receta: ingredientes desde H1 en modo selección, peso cocinado y raciones, y vista en vivo | 3 h | Coincide con TRD §7.5. Mezclar g y ml sin densidad la marca con ⚠. |
| 9.2 | Guardar la receta como producto derivado con la porción "ración" | 1.5 h | Aparece en la pestaña Recetas de H1 y se registra como cualquier producto. |
| 9.3 | RPC `apply_product_correction` y el diálogo "aplicar corrección" (rango y variación de kcal) | 2.5 h | Test: recalcula solo el rango indicado y marca `export_dirty` en lo ya exportado. |
| 9.4 | Integrar la corrección al editar un producto (D1) y al editar una receta | 1 h | Aparece solo si cambian los nutrientes y hay registros que lo usan. |

**Al terminar la fase:** recetas caseras y correcciones sin estropear el historial.

---

### Fase 10 · Apple Salud mediante Atajos (unas 12 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 10.1 | RPC `create_api_token` y `revoke_api_token`, y D7 (generar, copiar una vez y revocar) | 2 h | Solo se guarda el hash. Un token revocado devuelve 401. |
| 10.2 | Edge Function `health-sync` (entrada): validar el token y las muestras, deduplicar, peso del día y `daily_activity` | 3 h | `deno test`: enviar el mismo lote dos veces da `duplicates` y ningún cambio. El manual manda; si no, la muestra más temprana. Pasos con el máximo entre fuentes. |
| 10.3 | `health-sync` (salida): `to_export` (tope de 200) y `ack_exported` | 1.5 h | Test: si no confirmas, los registros se vuelven a enviar. Al confirmarlos, `exported_at` se rellena. |
| 10.4 | **Montar el atajo en tu iPhone** y escribir `docs/atajo-salud.md` paso a paso, con capturas | 3 h | Con una ejecución manual se importan el peso y los pasos de 7 días y se escriben las comidas en Salud. |
| 10.5 | Automatización diaria a las 23:30, botón "Sincronizar con Salud" (`shortcuts://`), aviso de más de 48 h sin sincronizar, toast de vuelta y pasos como contexto en Hoy y Progreso | 2 h | Una semana de uso real sin intervención: al menos 90 % de los días tienen peso de Salud (métrica del PRD). |
| 10.6 | En Ajustes, lista de "editados tras exportar" | 0.5 h | Muestra los registros con `export_dirty`. |

**Al terminar la fase:** ✅ el peso llega solo desde el reloj y las comidas aparecen en Apple Salud.

---

### Fase 11 · Copia de seguridad, PWA y acabado (unas 10 h)
| T | Tarea | ⏱ | ✅ |
|---|---|---|---|
| 11.1 | Exportar el JSON completo (formato de intercambio v1 ampliado) | 2 h | El archivo incluye todas las claves del Backend Schema §8 y valida contra su propio esquema. |
| 11.2 | Restaurar con la RPC `restore_backup` y su resumen por tabla, y el **test de ida y vuelta** | 2.5 h | exportar → restaurar en un usuario vacío → exportar da dos JSON idénticos. |
| 11.3 | Exportar CSV en un `.zip` (UTF-8 con BOM y `;`) y el recordatorio a los 30 días | 1.5 h | Excel en español abre los CSV con las tildes y los decimales bien. |
| 11.4 | PWA: `vite-plugin-pwa`, icono (ticket con "kcal"), `theme-color` según el modo y *app shell* en caché | 1.5 h | Al instalarla en la pantalla de inicio del iPhone, abre en pantalla completa sin la barra de Safari. |
| 11.5 | Auditoría de accesibilidad y rendimiento: axe en los E2E, Dynamic Type al 200 %, VoiceOver en el flujo de registro, Lighthouse (LCP < 2.5 s y bundle < 250 KB) | 1.5 h | 0 violaciones serias. Las métricas se cumplen. |
| 11.6 | `DESIGN.md` documentado a partir de lo construido (*impeccable document*) y revisión final del diseño | 1 h | `DESIGN.md` refleja los tokens y componentes reales. |

**Al terminar la fase:** ✅ **la versión 1.0 completa del PRD**, con tus datos a salvo fuera de Supabase.

---

### Could (después de la versión 1.0, sin planificar)
Importar el Excel de la AESAN (C1), la densidad para convertir entre ml y g (C2) e importar CSV (C3).

## 3. Calendario orientativo (a 6–7 h por semana)
| Semanas | Fases | Hito |
|---|---|---|
| 1–3 | 0, 1 | Base y dominio |
| 4–5 | 2 | Login y perfil |
| 6–9 | 3, 4 | ⭐ **La usas a diario** (unas 9 semanas) |
| 10–11 | 5 | TDEE adaptativo |
| 12–13 | 6 | Escáner |
| 14–15 | 7 | Registro rápido |
| 16–18 | 8 | Importación desde IA y supermercados |
| 19–20 | 9 | Recetas |
| 21–22 | 10 | Apple Salud |
| 23–24 | 11 | **Versión 1.0** |

Total: **unas 131 h, unas 24 semanas**. El TDEE adaptativo necesita al menos 14 días de datos, así que empezar a usar la app en la semana 9 hace que la fase 5 se pueda validar con datos reales.

## 4. Riesgos y mitigación
| Riesgo | Mitigación |
|---|---|
| El atajo de iOS no puede leer o escribir algún tipo de dato | Probar la tarea 10.4 **antes** de la 10.2–10.3: hacer en la fase 6 o antes un prototipo de atajo de 30 minutos contra un endpoint de prueba. |
| ZXing lento en Safari | Introducción manual del código siempre disponible. Valorar otras librerías en la tarea 6.4. |
| Pausa del proyecto de Supabase por 7 días de inactividad (sobre todo dev) | En prod no ocurre porque lo usas a diario. En dev, una GitHub Action semanal que hace una consulta. |
| Falta de tiempo en época de exámenes | Las fases son incrementales y la 4 ya es usable. Las fases 7–11 se pueden reordenar. |

## Decisiones abiertas
1. **Nombre de la app y del repositorio.** Por ahora, "AppCalorias" (User-Agent) y la carpeta `app gym`.
2. **Prototipo del atajo de iOS:** ¿lo adelantamos al final de la fase 4 para descartar el riesgo pronto? (propuesta: sí, 30 minutos).
3. **Actualizar la línea del TRD §9** sobre `supabase start` para usar el proyecto `calorias-dev` (propuesta: sí, al aprobar este plan).

## Supuestos
- El plan gratuito de Supabase permite 2 proyectos activos a la vez.
- Tienes cuenta en GitHub, Supabase y Cloudflare, y una clave gratuita de USDA (data.gov).
- Las estimaciones incluyen escribir los tests pero no la curva de aprendizaje de herramientas nuevas (Supabase y Deno). Puede que la fase 0–2 te lleve un 30–50 % más.
- Probarás cada PR en tu iPhone desde la URL de previsualización.
