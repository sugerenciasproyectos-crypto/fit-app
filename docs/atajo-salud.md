# Atajo «Sync Salud»: Apple Salud ↔ app de calorías

Este atajo de iOS hace de puente entre Apple Salud y la app (TRD §6.4):

- **lee** de Salud el peso, los pasos y la energía activa de los últimos 7 días y los envía a la app;
- **escribe** en Salud cada comida registrada en la app (energía, proteínas, hidratos, grasas, fibra, azúcares y grasas saturadas);
- **recuerda** qué comidas ha escrito, para confirmarlas en la siguiente ejecución. Si una ejecución falla a mitad, no se pierde nada.

Tiempo estimado: 30–40 minutos la primera vez.

---

## 0. Antes de empezar

1. En la app: **Ajustes → Apple Salud → Generar token**. Copia el token (empieza por `cal_`). **Solo se muestra una vez.**
2. En la misma pantalla, copia la **dirección del atajo** (termina en `/functions/v1/health-sync`).
3. En el iPhone, abre la app **Atajos** → pestaña **Atajos** → **+** → ponle de nombre exactamente **`Sync Salud`** (el botón de la app abre el atajo por ese nombre).

> El token es una contraseña: no lo compartas. Si se filtra, en la app pulsa **Generar uno nuevo** y el anterior deja de funcionar al instante.

---

## 1. Variables de configuración

> **Cómo se crea cada «variable» de esta guía:** se usan dos acciones seguidas. Primero la acción que produce el valor (por ejemplo **Texto**) y justo debajo **Establecer variable**, con el nombre indicado. Después, donde la guía dice `URL`, `TOKEN`, etc., toca el campo, elige **Seleccionar variable** (o la barra de variables sobre el teclado) y elige esa variable. En lugar de **Establecer variable** también vale renombrar la salida de la acción (tócala → **Renombrar**), pero no todas las versiones de iOS lo permiten.

Añade estas acciones al principio:

1. **Texto** (escribe dentro la dirección del atajo) → **Establecer variable** `URL`.
2. **Texto** (escribe dentro el token, sin comillas ni espacios) → **Establecer variable** `TOKEN`.
3. **Fecha** («Fecha actual») → **Ajustar fecha** («Restar 7 días») → **Establecer variable** `DESDE`.

En el resto de la guía, «Renombra a `X`» significa lo mismo: añade **Establecer variable** `X` justo después de esa acción. Y «Añadir a la variable» es la acción **Añadir a variable**, que va acumulando elementos en una lista.

---

## 2. Leer de Salud

Repite este bloque tres veces, una por tipo (peso, pasos y energía activa):

1. **Buscar muestras de salud**
   - Tipo: **Peso** (luego **Pasos** y **Energía activa**)
   - Filtro: **Fecha de inicio** «es posterior a» `DESDE`
   - Ordenar por: Fecha de inicio · Límite: desactivado
2. **Repetir con cada elemento** (sobre las muestras encontradas). Dentro del bucle:
   - **Diccionario** con estas claves (todas de tipo Texto salvo `value`, que es Número):

     | Clave | Valor |
     |---|---|
     | `type` | `weight` (o `steps`, `active_kcal`) |
     | `value` | Elemento de repetición → **Valor** |
     | `unit` | `kg` (o `count`, `kcal`) |
     | `start` | Elemento de repetición → **Fecha de inicio** con formato **ISO 8601** |
     | `end` | Elemento de repetición → **Fecha de finalización** con formato **ISO 8601** |
     | `source` | Elemento de repetición → **Fuente** |

   - **Añadir a la variable** `MUESTRAS`.

> Para el formato ISO 8601: toca la variable de fecha → **Formato de fecha: ISO 8601** y activa **Incluir hora**.
> El peso debe ir en **kg**: si tu báscula usa otra unidad, en la variable elige **Convertir a: kg**.

---

## 3. Enviar a la app

1. **Obtener archivo** de iCloud Drive → `Atajos/sync-salud-ack.txt` (desactiva «Mostrar error si no se encuentra»). Renombra a `ACK_TEXTO`.
2. **Dividir texto** `ACK_TEXTO` por **Saltos de línea**. Renombra a `ACK`.
3. **Diccionario** `CUERPO`:
   - `device` (Texto): `iPhone`
   - `samples` (Matriz): la variable `MUESTRAS`
   - `ack_exported` (Matriz): la variable `ACK`
4. **Obtener contenido de URL**:
   - URL: `URL`
   - Método: **POST**
   - Cabeceras: `Authorization` = `Bearer ` + `TOKEN` · `Content-Type` = `application/json`
   - Cuerpo de la solicitud: **Archivo** → `CUERPO` (o **JSON** con las tres claves).
5. **Obtener valor del diccionario** `to_export` del resultado. Renombra a `EXPORTAR`.

Si la respuesta tiene la clave `error` (por ejemplo, «Token no válido o revocado»), añade un **Si** que muestre una notificación con ese texto y **Detener atajo**.

---

## 4. Escribir las comidas en Salud

1. **Texto** vacío → renombra a `NUEVO_ACK`.
2. **Repetir con cada elemento** de `EXPORTAR`. Dentro:
   - Para cada nutriente, un **Si** «tiene cualquier valor» y dentro **Registrar muestra de salud**:

     | Clave de la app | Tipo en Salud | Unidad |
     |---|---|---|
     | `energy_kcal` | Energía alimentaria | kcal |
     | `protein_g` | Proteínas | g |
     | `carbs_g` | Hidratos de carbono | g |
     | `fat_g` | Grasa total | g |
     | `fiber_g` | Fibra | g |
     | `sugars_g` | Azúcar | g |
     | `saturated_fat_g` | Grasas saturadas | g |

     En cada una: **Fecha** = valor `at` del elemento.
   - **Combinar** en `NUEVO_ACK` el `id` del elemento seguido de un salto de línea.
3. **Guardar archivo** `NUEVO_ACK` en `Atajos/sync-salud-ack.txt` (activa **Sobrescribir**).

> Un nutriente con valor vacío (`null`) se **omite**, nunca se registra como 0.

---

## 5. Final

1. **Mostrar notificación**: «Salud sincronizada».
2. **Abrir URL**: la dirección de la app (para volver a ella; la app muestra «Datos de Salud actualizados»).

---

## 6. Permisos (primera ejecución)

iOS pedirá permiso al atajo para **leer** Peso, Pasos y Energía activa y para **escribir** Energía alimentaria, Proteínas, Hidratos, Grasa total, Fibra, Azúcar y Grasas saturadas. Acepta todos. La app web no necesita ningún permiso.

---

## 7. Automatización diaria (23:30)

1. Atajos → pestaña **Automatización** → **+** → **Hora del día** → **23:30**, **Diariamente**.
2. Selecciona **Ejecutar inmediatamente** (sin preguntar) y desactiva **Notificar al ejecutar** si no quieres el aviso.
3. Acción: **Ejecutar atajo** → `Sync Salud`.

---

## 8. Comprobar que funciona

1. Ejecuta el atajo a mano desde la app (**Ajustes → Apple Salud → Sincronizar con Salud**).
2. En la app, **Ajustes → Apple Salud** debe mostrar «Última sincronización: hoy…».
3. En **Hoy**, la tarjeta de peso debe decir «Salud ✓» si te pesaste hoy, y aparecen los pasos.
4. En la app Salud → **Nutrición → Energía alimentaria** aparecen tus comidas con su hora.
5. Ejecútalo otra vez: no debe duplicar nada (la app responde con `duplicates` y Salud no recibe comidas repetidas).

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| «Token no válido o revocado» | Generaste un token nuevo y el atajo tiene el antiguo. Pega el nuevo en `TOKEN`. |
| No llega el peso | La unidad no es kg o la fecha no está en ISO 8601. |
| Las comidas se escriben dos veces | El archivo `sync-salud-ack.txt` no se guarda (revisa «Sobrescribir» y la carpeta). |
| «Salud: sin sincronizar desde…» en Hoy | La automatización no se ejecutó en 48 h (iOS a veces la omite con el modo Ahorro de batería). |
