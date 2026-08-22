import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

console.log("🚀 Script iniciado...");

// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Obtener las credenciales desde el entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verificar que las variables existen
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno. Asegúrate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env');
  process.exit(1);
}

// Cliente de Supabase con permisos de administrador (service_role)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createSuperAdmin() {
  // ============================================
  // CONFIGURACIÓN: CAMBIA ESTOS DATOS
  // ============================================
  const email = 'admin@learnlink.com';      // Cambia por tu correo
  const password = 'Admin123!';             // Cambia por una contraseña segura
  const fullName = 'Super Administrador';   // Nombre que aparecerá en el perfil

  console.log('🚀 Iniciando creación de Super Administrador...');
  console.log(`📧 Email: ${email}`);

  // --------------------------------------------
  // 1. Crear usuario en Auth (confirmado automáticamente)
  // --------------------------------------------
  console.log('⏳ Creando usuario en Auth...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // Confirma el email automáticamente
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    console.error('❌ Error al crear usuario en Auth:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Usuario creado en Auth con ID: ${userId}`);

  // --------------------------------------------
  // 2. Insertar perfil en la tabla `profiles`
  // --------------------------------------------
  console.log('⏳ Insertando perfil en la tabla profiles...');
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    console.error('❌ Error al insertar perfil:', profileError.message);
    return;
  }
  console.log('✅ Perfil insertado correctamente');

  // --------------------------------------------
  // 3. Asignar rol `super_admin` en `user_roles`
  // --------------------------------------------
  console.log('⏳ Asignando rol super_admin...');
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'super_admin',
    });

  if (roleError) {
    console.error('❌ Error al asignar rol:', roleError.message);
    return;
  }
  console.log('✅ Rol super_admin asignado correctamente');

  // --------------------------------------------
  // 4. ¡Éxito!
  // --------------------------------------------
  console.log('\n🎉 ¡Super Administrador creado exitosamente!');
  console.log('====================================');
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Contraseña: ${password}`);
  console.log(`🆔 ID:       ${userId}`);
  console.log('====================================');
  console.log('⚠️  Guarda esta información en un lugar seguro.');
  console.log('🔗 Ahora puedes iniciar sesión en: https://tu-proyecto.netlify.app/admin-login');
}

// Ejecutar la función
createSuperAdmin();