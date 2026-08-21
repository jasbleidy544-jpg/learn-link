
# Panel Institucional Funcional

Solo se modifica el panel institucional, el flujo de registro (validación del código) y se añade lógica de riesgo IA. No se toca el resto de la app.

## Estado actual (ya existe)
- Tabla `institutions` con `student_code` / `teacher_code` únicos y RPC `validate_institution_code`.
- `profiles.institution_id` y `profiles.institution`.
- Componente `InstitutionCodeInput` que ya valida el código contra la BD en el registro.
- `InstitutionDashboard.tsx` básico (lista estudiantes y docentes filtrados por institución).
- `subject_journeys` y `subject_level_progress` para progreso por materia.

Por lo tanto NO se crea una tabla "instituciones" nueva: se reutiliza la existente y los códigos ya creados desde el panel admin.

## Parte 1 — Vínculo real del código institucional

**Registro (`src/pages/Register.tsx`)**
- Cuando `userType` es `student` o `teacher`, el código institucional pasa a ser **obligatorio** (hoy es opcional vía `studentAffiliation`).
- Bloquear el botón "Registrarse" hasta que `instMatch` sea válido y del tipo correcto (`student` o `teacher`).
- Mensaje exacto si no existe: *"Código institucional no válido. Verifica con tu institución."*
- Pasar `institution_id` y `institution` (nombre) en el `metadata` del `signUp`.

**Trigger `handle_new_user`** (migración)
- Extender para leer `raw_user_meta_data->>'institution_id'` y `'institution'` y persistirlos en `profiles` al crear el usuario, de modo que el vínculo aparezca inmediatamente en el panel del rector.

**Última conexión**
- Añadir columna `profiles.last_sign_in_at timestamptz` y actualizarla desde el cliente al iniciar sesión (en `useAuth` `onAuthStateChange` evento `SIGNED_IN`), o mediante un RPC `touch_last_sign_in`.

## Parte 2 — Panel funcional

Refactor de `src/pages/InstitutionDashboard.tsx` (sin tocar otras secciones), separando en sub-componentes nuevos bajo `src/components/institution/`:

- `InstitutionSummary.tsx` — 6 tarjetas: total estudiantes, total docentes, riesgo promedio, conteos rojo/naranja/verde.
- `StudentsTable.tsx` — columnas: Nombre, Grado, Materias activas, Nivel promedio, Último acceso, Progreso %, Riesgo, Acciones.
  - "Materias activas" = `count(subject_journeys)` por usuario.
  - "Nivel promedio" = promedio de `current_level` mapeado a Principiante/Intermedio/Avanzado/Experto.
  - "Progreso %" = `(niveles completados / total niveles) * 100` sobre `subject_level_progress`.
  - Riesgo desde `student_risk` (ver Parte 3) con badge 🔴/🟠/🟢.
- `TeachersTable.tsx` — Nombre, Materias, Estudiantes acompañados (`count(profiles.assigned_teacher_id = teacher.id)`), Último acceso, Estado (Activo si `last_sign_in_at` en últimos 3 días), Acciones.
- `StudentDetailDialog.tsx` — datos, diagnósticos por materia (`subject_diagnostics`), camino actual (`subject_journeys.camino` + `subject_level_progress`), últimos 10 accesos (nueva tabla `login_events` o lectura de `platform_interactions` con tipo `login`), nota IA (`student_risk.ai_note`).
- `TeacherDetailDialog.tsx` — perfil del docente y estudiantes acompañados.
- Wrapper móvil con `overflow-x-auto` en todas las tablas.

## Parte 3 — Análisis de deserción por IA

**Tabla nueva `student_risk`** (migración)
```
user_id uuid PK, institution_id uuid, risk_level text (low|medium|high),
risk_score numeric, ai_note text, factors jsonb, computed_at timestamptz
```
+ GRANTs + RLS:
- Estudiante lee su propio registro.
- Docente lee los de su institución.
- Owner de institución lee los de su `institution_id`.
- `super_admin` ALL.
- Inserts/updates solo desde edge function (service role).

**Edge function `compute-dropout-risk`** (nueva, `verify_jwt = false` + validación de JWT en código)
- Input: `{ user_id? , institution_id? }`. Si `institution_id`, recalcula todos los estudiantes de esa institución.
- Calcula factores:
  - Días desde `last_sign_in_at`.
  - % de progreso (`subject_level_progress` vs `subject_journeys.camino`).
  - Actividades completadas/abandonadas (`platform_interactions`).
  - Velocidad de avance (delta de progreso últimos 7 días).
  - Dificultad detectada en diagnósticos.
- Reglas duras:
  - 🔴 Alto: >7 días sin acceso **o** progreso <20%.
  - 🟠 Medio: progreso 20–60% o actividad irregular.
  - 🟢 Bajo: acceso frecuente y progreso >60%.
- Llama a Lovable AI (`google/gemini-3-flash-preview`, ver nota) con los factores para generar `ai_note` (2–3 frases en español, tono recomendado por el cliente).
- Hace `upsert` en `student_risk`.

**Disparadores de recalculo**
- Client-side: tras completar/abandonar un nivel en "Mi Acompañamiento Digital" se invoca la function con el `user_id`.
- Cron diario: edge function `compute-dropout-risk-cron` (pg_cron `select cron.schedule` invocando vía `pg_net` al endpoint) que recorre todas las instituciones cada 24 h.

**Nota sobre el modelo**: El gateway de Lovable AI no expone `claude-sonnet-4-20250514`. Se usará `google/gemini-3-flash-preview` con un system prompt equivalente. Si quieres Claude estricto, hay que añadir una `ANTHROPIC_API_KEY` como secreto.

## Parte 4 — Tiempo real

En `InstitutionDashboard.tsx` suscribir canales Supabase Realtime (publication `supabase_realtime`):
- `profiles` filtrado por `institution_id` → refrescar listas y resumen.
- `subject_journeys` y `subject_level_progress` filtrados por institución (vía join en cliente) → actualizar progreso.
- `student_risk` filtrado por `institution_id` → cambia badge sin recargar.

Migración: `ALTER PUBLICATION supabase_realtime ADD TABLE profiles, subject_journeys, subject_level_progress, student_risk;` y `REPLICA IDENTITY FULL` donde aplique.

## Parte 5 — Filtros, búsqueda y export

Encima de cada tabla:
- Input de búsqueda (nombre/email).
- Select de grado (lista derivada de los datos).
- Select de riesgo (Alto/Medio/Bajo/Todos) — solo en estudiantes.
- Select de estado (Activo/Inactivo) — solo en docentes.
- Botón "Exportar CSV" (reutilizar `exportToCSV` de `src/lib/adminAudit.ts`) que exporta exactamente lo visible/filtrado.

## Reglas técnicas / Seguridad

- Acceso al panel: ya está protegido por rol `institution` + `ProtectedRoute`. Confirmar que la query base usa `institution_id = (institución del owner)` para aislar datos.
- RLS de `student_risk` y verificación en edge function de que el JWT del solicitante sea owner de la institución consultada.
- Todas las tablas con `overflow-x-auto` y mínimo `min-w-[640px]` en mobile.

## Archivos a crear / modificar

Modificar:
- `src/pages/Register.tsx` (código obligatorio + metadata).
- `src/hooks/useAuth.tsx` (actualizar `last_sign_in_at` en SIGNED_IN).
- `src/pages/InstitutionDashboard.tsx` (refactor a sub-componentes + realtime + filtros).
- `src/components/acompanamiento/LevelDialog.tsx` (invocar `compute-dropout-risk` al terminar/abandonar nivel).

Crear:
- `src/components/institution/InstitutionSummary.tsx`
- `src/components/institution/StudentsTable.tsx`
- `src/components/institution/TeachersTable.tsx`
- `src/components/institution/StudentDetailDialog.tsx`
- `src/components/institution/TeacherDetailDialog.tsx`
- `supabase/functions/compute-dropout-risk/index.ts`
- `supabase/functions/compute-dropout-risk-cron/index.ts`
- Migración: tabla `student_risk` + GRANTs + RLS + `profiles.last_sign_in_at` + extender `handle_new_user` + realtime publication + pg_cron.

## Preguntas antes de implementar

1. ¿OK usar `google/gemini-3-flash-preview` en vez de Claude (no disponible en el gateway)?
2. ¿Hago obligatorio el código institucional **también para docentes voluntarios**, o ellos pueden seguir registrándose sin código?
3. Para el "Historial de accesos (últimos 10)", ¿reutilizo `platform_interactions` con `type='login'` o creo tabla nueva `login_events`?
