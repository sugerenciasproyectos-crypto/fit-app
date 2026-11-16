# Atajo «Sync Salud»: guía paso a paso

Este atajo de iOS conecta Apple Salud con la app (TRD §6.4):

- **lee** el peso, los pasos y la energía activa de los últimos 7 días y los envía a la app;
- **escribe** en Salud cada comida registrada en la app;
- **recuerda** qué comidas ya escribió, para confirmarlas en la siguiente ejecución y no duplicarlas.

Tiempo: 30–45 minutos la primera vez. Hazlo con calma: son unas 45 acciones.

---

## 0. Preparación

### 0.1 En la app
1. **Ajustes → Apple Salud → Generar token.** Pulsa **Copiar token** y pégalo en una nota temporal (empieza por `cal_`). Solo se muestra una vez.
2. En la misma pantalla, toca **copiar** junto a «Dirección del atajo». Pégala también en la nota. Es:
   `https://qizmwwulrqxnurxuerlf.supabase.co/functions/v1/health-sync`

### 0.2 En Archivos
3. Abre la app **Archivos** → **iCloud Drive** → carpeta **Atajos** (la crea la app Atajos; si no existe, créala).
4. Crea un archivo de texto vacío llamado `sync-salud-ack.txt` dentro. La forma más fácil: lo creará el propio atajo en el paso 6; si la primera ejecución da error al leerlo, ejecuta el atajo una segunda vez.

### 0.3 Crear el atajo
5. App **Atajos** → pestaña **Atajos** → **+** (arriba a la derecha).
6. Toca el nombre arriba → **Renombrar** → escribe exactamente **`Sync Salud`** (con mayúscula y espacio: el botón de la app lo abre por ese nombre).

### Cómo se trabaja en el editor (léelo una vez)
- **Añadir una acción:** barra de búsqueda inferior («Buscar acciones») → escribe el nombre → tócala. Se añade al final.
- **Mover una acción:** mantenla pulsada y arrástrala.
- **Insertar una variable en un campo:** toca el campo → aparece una barra sobre el teclado con las variables recientes; si no está la que buscas, toca **Seleccionar variable** y toca la acción o variable que quieras.
- **Variable mágica:** la salida de cada acción (p. ej. «Elemento de repetición», «Contenido de la URL») se puede insertar sin guardarla.
- **Propiedades de una variable:** toca la variable ya insertada (la «píldora» azul) para elegir una propiedad (Valor, Fecha de inicio…) o el formato de fecha.
- En esta guía, `NOMBRE` en mayúsculas es una variable creada con **Establecer variable**, y «Elemento de repetición» es la variable que da **Repetir con cada elemento**.

---

## 1. Configuración (acciones 1–7)

| # | Acción | Qué poner |
|---|---|---|
| 1 | **Texto** | Pega la dirección `https://…/functions/v1/health-sync` |
| 2 | **Establecer variable** | Nombre: `URL` · Entrada: Texto (sale sola) |
| 3 | **Texto** | Pega el token `cal_…` (sin espacios ni saltos de línea) |
| 4 | **Establecer variable** | Nombre: `TOKEN` |
| 5 | **Fecha** | «Fecha actual» (valor por defecto) |
| 6 | **Ajustar fecha** | **Restar** · `7` · **días** · de la variable *Fecha* |
| 7 | **Establecer variable** | Nombre: `DESDE` · Entrada: *Fecha ajustada* |

---

## 2. Leer el peso (acciones 8–12)

| # | Acción | Qué poner |
|---|---|---|
| 8 | **Buscar muestras de salud** | Toca «Tipo» → **Peso**. Toca **Añadir filtro** → **Fecha de inicio** · **es posterior a** · inserta `DESDE`. Ordenar por **Fecha de inicio**. Sin límite. |
| 9 | **Repetir con cada elemento** | En: *Muestras de salud* (sale solo) |
| 10 | **Texto** (dentro del bucle) | Escribe exactamente lo de abajo, insertando las variables donde pone ⟦…⟧ |
| 11 | **Añadir a variable** (dentro del bucle) | Variable: `MUESTRAS` · Entrada: *Texto* de la acción 10 |
| 12 | *Fin del bucle* | (lo pone iOS solo) |

Texto de la acción 10 (una sola línea, sin saltos):

```
{"type":"weight","value":"⟦Valor⟧","unit":"kg","start":"⟦Fecha de inicio⟧","source":"⟦Nombre de la fuente⟧"}
```

Para cada ⟦…⟧: inserta **Elemento de repetición**, tócalo y elige la propiedad:
- ⟦Valor⟧ → propiedad **Valor**. Si te ofrece unidad, elige **kg**.
- ⟦Fecha de inicio⟧ → propiedad **Fecha de inicio** y después, tocándola otra vez, **Formato de fecha: ISO 8601** con **Incluir hora** activado.
- ⟦Nombre de la fuente⟧ → propiedad **Nombre de la fuente**.

> Las comillas alrededor del valor son a propósito: si iOS escribe `78,4` con coma, la app lo entiende igual.

---

## 3. Leer pasos y energía activa (acciones 13–22)

Repite el bloque del peso dos veces con estos cambios. En la acción **Buscar muestras de salud** activa además **Agrupar por: Día** (así llega un total por día en vez de miles de muestras).

**Pasos** (acciones 13–17):
- Tipo: **Pasos** · Agrupar por **Día**.
- Texto del bucle:
  ```
  {"type":"steps","value":"⟦Valor⟧","unit":"count","start":"⟦Fecha de inicio⟧","end":"⟦Fecha de finalización⟧","source":"Salud"}
  ```
- **Añadir a variable** `MUESTRAS`.

**Energía activa** (acciones 18–22):
- Tipo: **Energía activa** · Agrupar por **Día**. Si pide unidad, **kcal**.
- Texto del bucle:
  ```
  {"type":"active_kcal","value":"⟦Valor⟧","unit":"kcal","start":"⟦Fecha de inicio⟧","end":"⟦Fecha de finalización⟧","source":"Salud"}
  ```
- **Añadir a variable** `MUESTRAS`.

Las dos fechas, igual que antes: **ISO 8601** con hora.

---

## 4. Enviar a la app (acciones 23–31)

| # | Acción | Qué poner |
|---|---|---|
| 23 | **Combinar texto** | Entrada: `MUESTRAS` · Separador: **Personalizado** → escribe una coma `,` |
| 24 | **Establecer variable** | `MUESTRAS_JSON` · Entrada: *Texto combinado* |
| 25 | **Obtener archivo** | Servicio: iCloud Drive · Ruta: `Atajos/sync-salud-ack.txt` · **desactiva** «Mostrar error si no se encuentra» |
| 26 | **Establecer variable** | `ACK` · Entrada: *Archivo* |
| 27 | **Texto** | Escribe lo de abajo, insertando las dos variables |
| 28 | **Obtener contenido de URL** | Ver configuración abajo |
| 29 | **Obtener valor del diccionario** | **Obtener valor de** `error` **en** *Contenido de la URL* |
| 30 | **Si** | Entrada: *Valor del diccionario* · **tiene cualquier valor** |
| 31 | → dentro del Si: **Mostrar notificación** con el texto «Sync Salud: » + *Valor del diccionario*, y debajo **Detener este atajo**. Deja vacío el «De lo contrario». |

Texto de la acción 27 (una sola línea):

```
{"device":"iPhone","samples":[⟦MUESTRAS_JSON⟧],"ack_exported":[⟦ACK⟧]}
```

Configuración de la acción 28 (toca **Mostrar más**):
- URL: inserta `URL`.
- Método: **POST**.
- Cabeceras → **Añadir nueva cabecera**:
  - Clave `Authorization` · Valor: escribe `Bearer ` (con un espacio al final) y a continuación inserta `TOKEN`.
  - Clave `Content-Type` · Valor `application/json`.
- Cuerpo de la solicitud: **Archivo** → inserta el *Texto* de la acción 27.

> Si no hay muestras o el archivo está vacío, el texto queda `"samples":[]` o `"ack_exported":[]`, que es válido.

---

## 5. Escribir las comidas en Salud (acciones 32–…)

| # | Acción | Qué poner |
|---|---|---|
| 32 | **Obtener valor del diccionario** | **Obtener valor de** `to_export` **en** *Contenido de la URL* |
| 33 | **Repetir con cada elemento** | En: *Valor del diccionario* |
| 34 | (dentro) **Obtener valor del diccionario** | `at` en *Elemento de repetición* |
| 35 | (dentro) **Establecer variable** | `FECHA_COMIDA` |
| 36 | (dentro) bloque de nutriente × 7 | ver abajo |
| 37 | (dentro) **Obtener valor del diccionario** | `id` en *Elemento de repetición* |
| 38 | (dentro) **Texto** | `"⟦Valor del diccionario⟧"` (el id entre comillas dobles) |
| 39 | (dentro) **Añadir a variable** | `IDS` |
| 40 | *Fin del bucle* | |

**Bloque de nutriente** (repítelo 7 veces dentro del bucle, cambiando clave y tipo):

1. **Obtener valor del diccionario** → clave (tabla) en *Elemento de repetición*.
2. **Si** → *Valor del diccionario* **tiene cualquier valor**.
3. Dentro del Si: **Registrar muestra de salud** → Tipo (tabla) · Valor: *Valor del diccionario* · Unidad (tabla) · **Fecha**: `FECHA_COMIDA`.
4. *Fin del Si* (deja vacío el «De lo contrario»).

| Clave | Tipo en «Registrar muestra de salud» | Unidad |
|---|---|---|
| `energy_kcal` | Energía alimentaria | kcal |
| `protein_g` | Proteínas | g |
| `carbs_g` | Hidratos de carbono | g |
| `fat_g` | Grasa total | g |
| `fiber_g` | Fibra | g |
| `sugars_g` | Azúcar | g |
| `saturated_fat_g` | Grasas saturadas | g |

> Truco: monta el primer bloque completo, mantenlo pulsado sobre la acción **Obtener valor del diccionario** → **Duplicar** (también duplica lo que haya dentro si seleccionas el Si), y cambia solo la clave, el tipo y la unidad.

---

## 6. Guardar lo exportado y terminar

| # | Acción | Qué poner |
|---|---|---|
| 41 | **Combinar texto** | Entrada: `IDS` · Separador personalizado `,` |
| 42 | **Guardar archivo** | Entrada: *Texto combinado* · Servicio iCloud Drive · **desactiva** «Preguntar dónde guardar» · Subruta: `Atajos/sync-salud-ack.txt` · **activa** «Sobrescribir si el archivo existe» |
| 43 | **Mostrar notificación** | «Salud sincronizada» |
| 44 | **Abrir URL** | `https://fit-app-lac-omega.vercel.app` (vuelve a la app; al volver, refresca los datos) |

> Si no había comidas que exportar, `IDS` está vacía y el archivo queda vacío: correcto.

---

## 7. Primera ejecución y permisos

1. Pulsa ▶︎ abajo a la derecha.
2. iOS pedirá permisos de Salud: **Activar todo** para lectura (Peso, Pasos, Energía activa) y para escritura (los 7 tipos de nutrición). Acepta también el acceso a iCloud Drive y a Internet.
3. Si sale «Sync Salud: Token no válido o revocado», revisa la acción 3 (token completo, sin espacios) y la cabecera `Bearer ` con espacio.
4. Si la acción 25 falla porque el archivo no existe, ejecuta otra vez: la acción 42 ya lo habrá creado.

---

## 8. Automatización diaria (23:30)

1. Atajos → pestaña **Automatización** → **+** → **Hora del día**.
2. **23:30**, **Diariamente**, marca **Ejecutar inmediatamente** y desactiva **Notificar al ejecutar** si no quieres el aviso.
3. **Siguiente** → elige el atajo **Sync Salud** → **OK**.

> Quita la acción 44 (**Abrir URL**) si no quieres que la app se abra sola a las 23:30. Para la ejecución manual no hace falta: el botón de la app ya te devuelve al cerrar el atajo si cambias de app.

---

## 9. Comprobar que funciona

1. En la app: **Ajustes → Apple Salud → Sincronizar con Salud**. Se abre el atajo y se ejecuta.
2. Vuelve a la app: en **Ajustes → Apple Salud** pone «Última sincronización: hoy…».
3. En **Hoy**, si te pesaste hoy, la tarjeta dice «Salud ✓» y aparecen los pasos.
4. En Salud → **Explorar → Nutrición → Energía alimentaria** aparecen tus comidas con su hora.
5. Ejecuta el atajo otra vez: no debe duplicar comidas en Salud (la app ya las tiene confirmadas).

## 10. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| «Token no válido o revocado» | Generaste un token nuevo o falta el espacio tras `Bearer`. Pega el token actual en la acción 3. |
| «JSON no válido» | Falta una comilla o llave en los textos de las acciones 10, 14, 19 o 27, o el separador de la acción 23 no es una coma. |
| No llega el peso | La fecha no está en ISO 8601 con hora, o el valor no está en kg. |
| Los pasos salen muy bajos o muy altos | Falta **Agrupar por: Día** en la búsqueda de pasos. |
| Comidas duplicadas en Salud | La acción 42 no sobrescribe el archivo (revisa la ruta y «Sobrescribir»). |
| «Salud: sin sincronizar desde…» en Hoy | La automatización no se ejecutó en 48 h (iOS a veces la omite con Ahorro de batería): ejecútala a mano. |
