-- Fase F: Diagnóstico adaptativo por asignatura con base curricular,
-- seguimiento por tema/competencia e intervención docente.
--
-- IMPORTANTE: subject_journeys, subject_level_progress y subject_diagnostics
-- ya eran referenciadas por el código del frontend y de las edge functions,
-- pero NUNCA existieron en la base de datos real (se verificó contra
-- information_schema). Por eso el flujo de diagnóstico por materia estaba
-- completamente roto en producción. Aquí se crean por primera vez, con las
-- columnas que el código ya esperaba más las nuevas columnas de seguimiento
-- por tema/competencia que pide el nuevo diagnóstico adaptativo.

-- ============================================================
-- 1. Base curricular (currículo de referencia por materia y grado)
-- ============================================================
create table if not exists public.curriculum_topics (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade_band text not null check (grade_band in ('6-7', '8-9', '10-11')),
  topic text not null,
  competencia text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subject, grade_band, topic)
);

alter table public.curriculum_topics enable row level security;

create policy "Currículo visible para todos los autenticados"
  on public.curriculum_topics for select
  to authenticated
  using (true);

-- ============================================================
-- 2. subject_journeys — perfil de aprendizaje por estudiante y materia
-- ============================================================
create table if not exists public.subject_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  nivel text,
  temas_fuertes text[] not null default '{}',
  temas_a_reforzar text[] not null default '{}',
  perfil text,
  mensaje_motivacional text,
  camino jsonb not null default '[]'::jsonb,
  current_level integer not null default 1,
  topic_results jsonb not null default '[]'::jsonb,
  diagnostico_inicial_pct integer,
  ultima_evaluacion_pct integer,
  recomendacion_ia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject)
);

alter table public.subject_journeys enable row level security;

create policy "Estudiante ve su propio camino"
  on public.subject_journeys for select
  using (auth.uid() = user_id);

create policy "Estudiante crea su propio camino"
  on public.subject_journeys for insert
  with check (auth.uid() = user_id);

create policy "Estudiante actualiza su propio camino"
  on public.subject_journeys for update
  using (auth.uid() = user_id);

create policy "Docente ve el camino de sus estudiantes asignados"
  on public.subject_journeys for select
  using (public.is_my_assigned_student(user_id));

-- ============================================================
-- 3. subject_level_progress — resultado de cada nivel del camino gamificado
-- ============================================================
create table if not exists public.subject_level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  level_index integer not null,
  score jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (user_id, subject, level_index)
);

alter table public.subject_level_progress enable row level security;

create policy "Estudiante ve su propio progreso por nivel"
  on public.subject_level_progress for select
  using (auth.uid() = user_id);

create policy "Estudiante registra su propio progreso por nivel"
  on public.subject_level_progress for insert
  with check (auth.uid() = user_id);

create policy "Estudiante actualiza su propio progreso por nivel"
  on public.subject_level_progress for update
  using (auth.uid() = user_id);

create policy "Docente ve el progreso por nivel de sus estudiantes"
  on public.subject_level_progress for select
  using (public.is_my_assigned_student(user_id));

-- ============================================================
-- 4. subject_diagnostics — historial de cada diagnóstico (para comparación)
-- ============================================================
create table if not exists public.subject_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  grade text,
  cuestionario jsonb not null default '{}'::jsonb,
  ejercicios jsonb not null default '[]'::jsonb,
  preguntas_tags jsonb not null default '[]'::jsonb,
  topic_results jsonb not null default '[]'::jsonb,
  overall_pct integer,
  created_at timestamptz not null default now()
);

alter table public.subject_diagnostics enable row level security;

create policy "Estudiante ve su propio historial de diagnósticos"
  on public.subject_diagnostics for select
  using (auth.uid() = user_id);

create policy "Estudiante crea su propio diagnóstico"
  on public.subject_diagnostics for insert
  with check (auth.uid() = user_id);

create policy "Docente ve el historial de diagnósticos de sus estudiantes"
  on public.subject_diagnostics for select
  using (public.is_my_assigned_student(user_id));

create index if not exists idx_subject_diagnostics_user_subject
  on public.subject_diagnostics (user_id, subject, created_at desc);

-- ============================================================
-- 5. subject_teacher_actions — intervención docente ("Seguimiento por asignatura")
-- ============================================================
create table if not exists public.subject_teacher_actions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  tipo text not null check (tipo in ('observacion', 'actividad_asignada', 'solicitud_reevaluacion', 'validacion')),
  tema text,
  contenido text,
  resuelto boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.subject_teacher_actions enable row level security;

create policy "Docente ve sus propias acciones de seguimiento"
  on public.subject_teacher_actions for select
  using (auth.uid() = teacher_id);

create policy "Docente crea acciones de seguimiento para sus estudiantes"
  on public.subject_teacher_actions for insert
  with check (auth.uid() = teacher_id and public.is_my_assigned_student(student_id));

create policy "Docente actualiza sus propias acciones de seguimiento"
  on public.subject_teacher_actions for update
  using (auth.uid() = teacher_id);

create policy "Estudiante ve las acciones de seguimiento sobre sí mismo"
  on public.subject_teacher_actions for select
  using (auth.uid() = student_id);

create index if not exists idx_subject_teacher_actions_student
  on public.subject_teacher_actions (student_id, subject, created_at desc);

-- ============================================================
-- 6. Realtime (el frontend ya se suscribe a estas tablas)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subject_journeys'
  ) then
    alter publication supabase_realtime add table public.subject_journeys;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subject_level_progress'
  ) then
    alter publication supabase_realtime add table public.subject_level_progress;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subject_teacher_actions'
  ) then
    alter publication supabase_realtime add table public.subject_teacher_actions;
  end if;
end $$;
insert into public.curriculum_topics (subject, grade_band, topic, competencia, orden) values
  ('Matemáticas', '6-7', 'Números enteros y racionales', 'Operaciones y representación numérica', 0),
  ('Matemáticas', '6-7', 'Proporcionalidad', 'Resolución de problemas', 1),
  ('Matemáticas', '6-7', 'Geometría plana básica', 'Reconocimiento de figuras y medidas', 2),
  ('Matemáticas', '6-7', 'Estadística descriptiva básica', 'Lectura e interpretación de datos', 3),
  ('Matemáticas', '8-9', 'Álgebra básica', 'Manejo de expresiones algebraicas', 0),
  ('Matemáticas', '8-9', 'Ecuaciones de primer grado', 'Resolución de problemas', 1),
  ('Matemáticas', '8-9', 'Proporcionalidad y porcentajes', 'Aplicación en situaciones cotidianas', 2),
  ('Matemáticas', '8-9', 'Geometría y medición', 'Cálculo de áreas y perímetros', 3),
  ('Matemáticas', '10-11', 'Álgebra', 'Manejo de expresiones algebraicas', 0),
  ('Matemáticas', '10-11', 'Ecuaciones', 'Resolución de problemas', 1),
  ('Matemáticas', '10-11', 'Funciones', 'Interpretación de relaciones entre variables', 2),
  ('Matemáticas', '10-11', 'Trigonometría', 'Aplicación en situaciones reales', 3),
  ('Matemáticas', '10-11', 'Estadística', 'Interpretación de datos', 4),
  ('Matemáticas', '10-11', 'Probabilidad', 'Razonamiento sobre el azar', 5),
  ('Castellano', '6-7', 'Comprensión lectora básica', 'Identificación de ideas principales', 0),
  ('Castellano', '6-7', 'Ortografía y gramática', 'Uso correcto del idioma', 1),
  ('Castellano', '6-7', 'Producción de textos narrativos', 'Expresión escrita', 2),
  ('Castellano', '6-7', 'Comunicación oral', 'Expresión de ideas propias', 3),
  ('Castellano', '8-9', 'Comprensión lectora', 'Interpretación de textos', 0),
  ('Castellano', '8-9', 'Argumentación básica', 'Construcción de ideas propias', 1),
  ('Castellano', '8-9', 'Literatura', 'Reconocimiento de géneros literarios', 2),
  ('Castellano', '8-9', 'Producción textual', 'Expresión escrita', 3),
  ('Castellano', '10-11', 'Comprensión lectora', 'Interpretación de textos', 0),
  ('Castellano', '10-11', 'Argumentación', 'Construcción y sustentación de ideas', 1),
  ('Castellano', '10-11', 'Literatura', 'Análisis crítico de obras', 2),
  ('Castellano', '10-11', 'Producción textual', 'Expresión escrita', 3),
  ('Castellano', '10-11', 'Análisis crítico', 'Evaluación de textos e intenciones del autor', 4),
  ('Lenguaje', '6-7', 'Comunicación oral y escrita', 'Expresión de ideas', 0),
  ('Lenguaje', '6-7', 'Comprensión de textos cotidianos', 'Interpretación básica', 1),
  ('Lenguaje', '6-7', 'Vocabulario y significado', 'Uso contextual de palabras', 2),
  ('Lenguaje', '8-9', 'Comunicación asertiva', 'Expresión de ideas con claridad', 0),
  ('Lenguaje', '8-9', 'Comprensión de textos diversos', 'Interpretación y análisis', 1),
  ('Lenguaje', '8-9', 'Medios de comunicación', 'Lectura crítica de mensajes', 2),
  ('Lenguaje', '10-11', 'Comunicación y persuasión', 'Análisis de intención comunicativa', 0),
  ('Lenguaje', '10-11', 'Comprensión de textos complejos', 'Interpretación crítica', 1),
  ('Lenguaje', '10-11', 'Lenguaje y contexto social', 'Análisis de discursos', 2),
  ('Inglés', '6-7', 'Vocabulario básico', 'Reconocimiento de palabras cotidianas', 0),
  ('Inglés', '6-7', 'Gramática: presente simple', 'Uso en oraciones sencillas', 1),
  ('Inglés', '6-7', 'Comprensión de lectura básica', 'Reading comprehension', 2),
  ('Inglés', '8-9', 'Vocabulario intermedio', 'Uso en contexto', 0),
  ('Inglés', '8-9', 'Gramática: tiempos verbales', 'Aplicación en oraciones', 1),
  ('Inglés', '8-9', 'Comprensión de lectura', 'Reading comprehension', 2),
  ('Inglés', '8-9', 'Producción escrita básica', 'Writing', 3),
  ('Inglés', '10-11', 'Vocabulario avanzado', 'Uso en contexto', 0),
  ('Inglés', '10-11', 'Gramática', 'Grammar usage', 1),
  ('Inglés', '10-11', 'Comprensión de lectura', 'Reading comprehension', 2),
  ('Inglés', '10-11', 'Producción escrita', 'Writing', 3),
  ('Física', '6-7', 'Movimiento y fuerzas básicas', 'Observación de fenómenos cotidianos', 0),
  ('Física', '6-7', 'Materia y energía', 'Reconocimiento de conceptos básicos', 1),
  ('Física', '8-9', 'Movimiento rectilíneo', 'Aplicación de conceptos básicos', 0),
  ('Física', '8-9', 'Fuerza y leyes de Newton', 'Comprensión del fenómeno antes que la fórmula', 1),
  ('Física', '8-9', 'Energía y trabajo', 'Aplicación en situaciones cotidianas', 2),
  ('Física', '10-11', 'Cinemática', 'Análisis de movimiento', 0),
  ('Física', '10-11', 'Dinámica (Leyes de Newton)', 'Aplicación en situaciones reales', 1),
  ('Física', '10-11', 'Energía, trabajo y potencia', 'Resolución de problemas', 2),
  ('Física', '10-11', 'Electricidad básica', 'Comprensión de circuitos simples', 3),
  ('Química', '6-7', 'Estados de la materia', 'Reconocimiento de cambios cotidianos', 0),
  ('Química', '6-7', 'Mezclas y sustancias', 'Diferenciación práctica', 1),
  ('Química', '8-9', 'Mezclas y soluciones', 'Aplicación en situaciones cotidianas', 0),
  ('Química', '8-9', 'Estructura de la materia', 'Reconocimiento de átomos y elementos', 1),
  ('Química', '8-9', 'Reacciones químicas básicas', 'Identificación de cambios', 2),
  ('Química', '10-11', 'Estructura atómica', 'Comprensión de modelos básicos', 0),
  ('Química', '10-11', 'Tabla periódica', 'Reconocimiento de propiedades', 1),
  ('Química', '10-11', 'Reacciones químicas', 'Balanceo y aplicación', 2),
  ('Química', '10-11', 'Química y vida cotidiana', 'Aplicación práctica', 3),
  ('Biología', '6-7', 'Seres vivos y sus características', 'Clasificación básica', 0),
  ('Biología', '6-7', 'Plantas y fotosíntesis', 'Comprensión de procesos cotidianos', 1),
  ('Biología', '6-7', 'Cuerpo humano básico', 'Reconocimiento de sistemas', 2),
  ('Biología', '8-9', 'Célula y organización', 'Comprensión de estructuras básicas', 0),
  ('Biología', '8-9', 'Sistemas del cuerpo humano', 'Aplicación a la vida cotidiana', 1),
  ('Biología', '8-9', 'Ecosistemas', 'Relaciones entre seres vivos', 2),
  ('Biología', '10-11', 'Genética básica', 'Comprensión de la herencia', 0),
  ('Biología', '10-11', 'Evolución', 'Análisis de procesos biológicos', 1),
  ('Biología', '10-11', 'Ecología y ecosistemas', 'Análisis de relaciones ambientales', 2),
  ('Biología', '10-11', 'Sistemas del cuerpo humano', 'Aplicación práctica', 3),
  ('Ciencias', '6-7', 'Método científico', 'Observación y experimentación básica', 0),
  ('Ciencias', '6-7', 'El universo y la Tierra', 'Reconocimiento de fenómenos naturales', 1),
  ('Ciencias', '6-7', 'Cuidado del medio ambiente', 'Aplicación práctica cotidiana', 2),
  ('Ciencias', '8-9', 'Método científico aplicado', 'Diseño de experimentos sencillos', 0),
  ('Ciencias', '8-9', 'Energía y materia', 'Comprensión de fenómenos cotidianos', 1),
  ('Ciencias', '8-9', 'Salud y bienestar', 'Aplicación práctica', 2),
  ('Ciencias', '10-11', 'Investigación científica', 'Análisis de resultados', 0),
  ('Ciencias', '10-11', 'Ciencia, tecnología y sociedad', 'Reflexión crítica', 1),
  ('Ciencias', '10-11', 'Sostenibilidad ambiental', 'Aplicación práctica', 2),
  ('Sociales', '6-7', 'Comunidad y convivencia', 'Reconocimiento de normas sociales', 0),
  ('Sociales', '6-7', 'Geografía básica de Colombia', 'Ubicación espacial', 1),
  ('Sociales', '6-7', 'Historia local', 'Reconocimiento de hechos cercanos', 2),
  ('Sociales', '8-9', 'Organización política y gobierno', 'Comprensión de decisiones públicas', 0),
  ('Sociales', '8-9', 'Historia de Colombia', 'Análisis de hechos históricos', 1),
  ('Sociales', '8-9', 'Geografía y economía', 'Relación entre territorio y recursos', 2),
  ('Sociales', '10-11', 'Democracia y participación ciudadana', 'Análisis crítico de decisiones de gobierno', 0),
  ('Sociales', '10-11', 'Historia contemporánea', 'Análisis de procesos históricos', 1),
  ('Sociales', '10-11', 'Economía y globalización', 'Comprensión de relaciones económicas', 2),
  ('Sociales', '10-11', 'Conflicto y paz en Colombia', 'Análisis crítico', 3),
  ('Filosofía', '6-7', 'Preguntas sobre uno mismo', 'Reflexión básica', 0),
  ('Filosofía', '6-7', 'Valores y convivencia', 'Reconocimiento práctico', 1),
  ('Filosofía', '8-9', 'Pensamiento crítico básico', 'Análisis de situaciones cotidianas', 0),
  ('Filosofía', '8-9', 'Ética y valores', 'Reflexión sobre decisiones', 1),
  ('Filosofía', '10-11', 'Lógica y argumentación', 'Construcción de razonamientos válidos', 0),
  ('Filosofía', '10-11', 'Ética', 'Reflexión sobre dilemas cotidianos', 1),
  ('Filosofía', '10-11', 'Filosofía política', 'Análisis de ideas sobre sociedad', 2),
  ('Filosofía', '10-11', 'Teoría del conocimiento', 'Reflexión sobre cómo sabemos lo que sabemos', 3),
  ('Arte', '6-7', 'Expresión artística básica', 'Exploración creativa', 0),
  ('Arte', '6-7', 'Colores y formas', 'Reconocimiento visual', 1),
  ('Arte', '8-9', 'Técnicas artísticas', 'Aplicación práctica', 0),
  ('Arte', '8-9', 'Historia del arte básica', 'Reconocimiento de estilos', 1),
  ('Arte', '10-11', 'Análisis de obras de arte', 'Interpretación crítica', 0),
  ('Arte', '10-11', 'Historia del arte', 'Contextualización histórica', 1),
  ('Arte', '10-11', 'Expresión artística personal', 'Creación con intención', 2),
  ('Religión', '6-7', 'Valores y convivencia', 'Reconocimiento práctico', 0),
  ('Religión', '6-7', 'Tradiciones culturales y religiosas', 'Reconocimiento de diversidad', 1),
  ('Religión', '8-9', 'Ética y valores religiosos', 'Reflexión sobre decisiones', 0),
  ('Religión', '8-9', 'Diversidad religiosa', 'Respeto por la diferencia', 1),
  ('Religión', '10-11', 'Ética y proyecto de vida', 'Reflexión personal', 0),
  ('Religión', '10-11', 'Diversidad religiosa y cultural', 'Análisis crítico y respeto', 1)
on conflict (subject, grade_band, topic) do nothing;
