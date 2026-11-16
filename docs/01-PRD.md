# 01 · PRD — App personal de conteo de calorías

> Estado: **v1.1 APROBADO (2026-11-16)** — decisiones abiertas cerradas con la propuesta · v1.0 aprobada el 2026-11-16 · Autor: Marco Calero Gallego
> Cambios de la v1.1: integración con Apple Salud mediante Atajos, favoritos, supermercados, importación de productos desde IA, edición completa de productos con su origen, copia de seguridad y exportación propias, y unidades en ml.

## 1. Problema
Las apps de conteo de calorías que hay en el mercado (Fitia, MacroFactor, MyFitnessPal…) o cobran una suscripción para lo importante o están cargadas de funciones que no uso. Además, casi todas calculan el gasto con una fórmula fija que no aprende de mis datos reales, y no aprovechan el peso que ya registro en Apple Salud. Quiero medir lo que como con precisión, rápido y sin pagar.

## 2. Objetivo
Una app web personal (PWA añadida a la pantalla de inicio del iPhone) que me permita:
1. Registrar lo que como en segundos, con porciones caseras, favoritos y escáner de códigos de barras.
2. Ver cada día los totales frente a mi objetivo de kcal y macros.
3. Ajustar el objetivo con un TDEE adaptativo alimentado por el peso que llega desde Apple Salud.
4. Mantener una base de productos propia, editable, que pueda ampliar importando un JSON generado con IA.

Todo con un coste de **0 €** y sin suscripción.

## 3. Usuario
- **Único usuario: yo.** Desarrollador, estudiante de 2.º de DAM, en España.
- Uso un **iPhone**. Tengo un reloj Nothing CMF con la app Nothing X, que escribe en **Apple Salud**, y el peso también llega a Salud.
- Mi objetivo puede ser perder, mantener o ganar peso.
- Compro en varios supermercados y repito productos y comidas a menudo.

## 4. Funcionalidades del MVP (MoSCoW)

### Must
| ID | Funcionalidad | Detalle |
|---|---|---|
| M1 | Perfil y objetivo | Sexo, fecha de nacimiento, altura, peso, nivel de actividad (5 factores) y objetivo (perder / mantener / ganar) con el ajuste en kcal. Calcula la TMB con Mifflin-St Jeor, el TDEE inicial, las kcal objetivo y los macros. |
| M2 | Base de productos | Nutrientes por 100 g o por 100 ml (`base_unit`): kcal, proteína, carbohidratos, azúcar, grasa, grasa saturada, fibra y sal. Tabla local de alimentos habituales y caché de todo lo consultado. |
| M3 | Búsqueda | Busca primero en la base local y en la caché; después, en USDA y Open Food Facts. Se puede filtrar por supermercado y por favoritos. |
| M4 | Escáner de códigos de barras | Escanea con la cámara y consulta Open Food Facts, normalizando los datos a por 100. Si el producto no existe, ofrece crearlo a mano. |
| M5 | Porciones caseras | Equivalencias de porción a cantidad (g o ml) por producto, marcando si la porción es estimada. |
| M6 | Diario de comidas | Comidas configurables por nombre y orden. Se añade un producto por cantidad o por porción, y se puede editar, borrar y marcar el día como incompleto. |
| M7 | Totales frente al objetivo | Kcal y macros consumidos y restantes del día. Los micronutrientes del alcance, como información secundaria. |
| M8 | Registro de peso | Manual o importado desde Salud, con un peso por día. |
| M9 | Tendencia de peso | EMA con α = 0.1. |
| M10 | TDEE adaptativo | Propuesta semanal que confirmo (ver el TRD). |
| M11 | Nube | Backend con plan gratuito, con inicio de sesión para un único usuario. |
| M12 | **Importar desde Apple Salud** | Peso (prioritario, alimenta el TDEE) y pasos/actividad (solo como contexto), mediante un atajo de iOS diario y bajo demanda. Las kcal quemadas del reloj solo se muestran a título informativo y **nunca se suman al objetivo**. |
| M13 | **Favoritos** | Marcar productos y comidas guardadas como favoritos para registrarlos con un toque. |
| M14 | **Edición completa de productos** | Todos los campos son editables: nombre, marca, código de barras, categoría, unidad, tamaño del envase, nutrientes, porciones, supermercados y favorito. Se guarda el origen (`source`), `created_at`, `updated_at` y si se editó a mano. Una edición manual nunca la sobrescribe una nueva consulta a la API. |
| M15 | **Importación de productos desde IA** | Pegar un JSON o abrir un archivo `.json` (`schema_version: 1`), validarlo y revisarlo en una vista previa editable. Si un producto ya existe, elegir entre actualizar, fusionar o crear uno nuevo. Muestra los `warnings` y marca para revisar los productos con `confidence: baja` o `source: estimado`. |
| M16 | **Snapshot en el diario** | Cada registro guarda una copia de los nutrientes de ese momento, con la opción "aplicar corrección a registros anteriores" al editar un producto. |

### Should
| ID | Funcionalidad |
|---|---|
| S1 | Recetas: ingredientes divididos entre las raciones o entre el peso final cocinado. |
| S2 | Comidas guardadas (plantillas) que se registran con un toque. |
| S3 | Pantalla de progreso: peso con su tendencia, evolución del TDEE, adherencia y pasos como contexto. |
| S4 | Opción de usar Katch-McArdle si introduzco mi % de grasa. |
| S5 | Recientes en la búsqueda. |
| S6 | Copiar una comida o un día anterior. |
| S7 | **Supermercados**: relación N:M entre productos y supermercados, con precio opcional. Los supermercados los gestiono yo. Las tiendas que traiga Open Food Facts solo se usan como sugerencia. Se puede filtrar la búsqueda y los favoritos por supermercado. |
| S8 | **Exportar a Apple Salud**: escribir las comidas registradas (energía, proteína, carbohidratos, grasa, fibra, azúcar y grasa saturada de la dieta) mediante el mismo atajo. |
| S9 | **Copia de seguridad propia**: exportación completa en JSON con el mismo formato ampliado que la importación desde IA, de forma simétrica, más una exportación CSV por tabla e importación desde ese JSON. |

### Could
| ID | Funcionalidad |
|---|---|
| C1 | Importar el Excel de la AESAN (2022). |
| C2 | Densidad opcional por producto para convertir entre ml y g. |
| C3 | Importar CSV (además del JSON). |

### Won't (en este MVP)
Plan de comidas automático, registro por foto o por voz, coach con IA dentro de la app, funciones sociales, ayuno, exportar a PDF, multiusuario, conexión directa con el reloj, sumar las kcal quemadas al objetivo, modo sin conexión completo y app nativa.

## 5. Fuera de alcance
- Todo lo marcado como Won't.
- **Sin conexión:** la app requiere red. La sincronización con Salud no es en tiempo real: va mediante Atajos.
- **BEDCA:** solo como consulta manual.
- **La IA no está integrada:** el prompt se usa fuera de la app y la app solo importa su JSON.
- Consejos médicos o nutricionales personalizados.

## 6. Métricas de éxito
| Métrica | Umbral |
|---|---|
| Adherencia | Registro al menos 6 de cada 7 días durante 4 semanas. |
| Velocidad | Menos de 15 s por alimento habitual (favorito, reciente o comida guardada). |
| Precisión del TDEE | Se estabiliza en ±100 kcal tras 3–4 semanas. |
| Peso automático | Al menos el 90 % de los días con peso tienen el peso importado desde Salud, sin introducirlo a mano. |
| Coste | 0 € al mes. |

## 7. Restricciones
- 0 €: planes gratuitos y sin cuenta de Apple Developer.
- iOS no permite que una web acceda a HealthKit, así que la integración con Salud se hace solo con Atajos.
- Atribución ODbL a Open Food Facts y envío de un User-Agent identificativo.
- Clave de USDA con un límite de 1.000 peticiones por hora.

## Decisiones abiertas
1. Hora de la automatización diaria del atajo (propuesta: 23:30).
2. Si una semana tiene un número alto de warnings en la importación desde IA, ¿se bloquea la importación? (propuesta: no, solo se avisa).

## Supuestos
- Nothing X y la báscula o la entrada manual escriben el peso en Apple Salud en el iPhone.
- Las automatizaciones personales de Atajos pueden ejecutarse sin confirmación (iOS 17 o posterior).
- Safari en iOS permite usar la cámara en una PWA servida por HTTPS.
- El plan gratuito de Supabase basta para un único usuario.
- Los micronutrientes que faltan se tratan como `null`, no como 0.
