import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "learnlink1.0@gmail.com";
const ADMIN_PASSWORD = "LearnLink123.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Check existing
    const { data: list } = await admin.auth.admin.listUsers();
    let user = list?.users?.find((u: any) => u.email === ADMIN_EMAIL);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Administrador General" },
      });
      if (error) throw error;
      user = data.user;
    } else {
      // Ensure password is in sync with the official credentials
      await admin.auth.admin.updateUserById(user.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    }

    if (user) {
      await admin.from("profiles").upsert({
        id: user.id,
        full_name: "Administrador General",
        email: ADMIN_EMAIL,
      });
      await admin.from("user_roles").upsert(
        { user_id: user.id, role: "super_admin" },
        { onConflict: "user_id,role" }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, email: ADMIN_EMAIL, created: !list?.users?.some((u: any) => u.email === ADMIN_EMAIL) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});