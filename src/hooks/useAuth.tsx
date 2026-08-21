import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [roleRes, profileRes] = await Promise.all([
        (supabase as any).from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        (supabase as any).from("profiles").select("*").eq("id", userId).maybeSingle(),
      ]);
      if (roleRes.data) setUserRole(roleRes.data.role);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 500);
          if (_event === "SIGNED_IN") {
            setTimeout(() => {
              (supabase as any).rpc("touch_last_sign_in").then(() => {}, () => {});
              (supabase as any).from("platform_interactions").insert({
                user_id: session.user.id,
                interaction_type: "login",
              }).then(() => {}, () => {});
            }, 600);
          }
        } else {
          setUserRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
  };

  const updateProfile = async (data: Record<string, any>) => {
    if (!user) return { error: new Error("Not authenticated") };
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (!error) {
      setProfile((prev: any) => ({ ...prev, ...data }));
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
