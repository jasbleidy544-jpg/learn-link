export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      actividades: {
        Row: {
          creado_en: string | null
          descripcion: string | null
          dificultad: string | null
          docente_id: string
          docente_nombre: string | null
          id: string
          institution_id: string | null
          materia: string
          preguntas: Json | null
          tema: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          creado_en?: string | null
          descripcion?: string | null
          dificultad?: string | null
          docente_id: string
          docente_nombre?: string | null
          id?: string
          institution_id?: string | null
          materia: string
          preguntas?: Json | null
          tema?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          creado_en?: string | null
          descripcion?: string | null
          dificultad?: string | null
          docente_id?: string
          docente_nombre?: string | null
          id?: string
          institution_id?: string | null
          materia?: string
          preguntas?: Json | null
          tema?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      actividades_estudiantes: {
        Row: {
          actividad_id: string
          completada: boolean | null
          enviada_en: string | null
          estudiante_id: string
          fecha_realizacion: string | null
          id: string
          puntaje: number | null
        }
        Insert: {
          actividad_id: string
          completada?: boolean | null
          enviada_en?: string | null
          estudiante_id: string
          fecha_realizacion?: string | null
          id?: string
          puntaje?: number | null
        }
        Update: {
          actividad_id?: string
          completada?: boolean | null
          enviada_en?: string | null
          estudiante_id?: string
          fecha_realizacion?: string | null
          id?: string
          puntaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_estudiantes_actividad_id_fkey"
            columns: ["actividad_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_estudiantes_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          content: string | null
          generated_at: string | null
          id: string
          is_read: boolean | null
          priority: string | null
          student_id: string
          title: string
          type: string | null
        }
        Insert: {
          content?: string | null
          generated_at?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          student_id: string
          title: string
          type?: string | null
        }
        Update: {
          content?: string | null
          generated_at?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          student_id?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      asignaciones: {
        Row: {
          creado_en: string | null
          creado_por: string | null
          docente_id: string
          estudiante_id: string
          id: string
          institution_id: string | null
        }
        Insert: {
          creado_en?: string | null
          creado_por?: string | null
          docente_id: string
          estudiante_id: string
          id?: string
          institution_id?: string | null
        }
        Update: {
          creado_en?: string | null
          creado_por?: string | null
          docente_id?: string
          estudiante_id?: string
          id?: string
          institution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          area: string | null
          challenge_date: string
          challenge_type: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          student_id: string
          title: string
          xp_reward: number | null
        }
        Insert: {
          area?: string | null
          challenge_date?: string
          challenge_type?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          student_id: string
          title: string
          xp_reward?: number | null
        }
        Update: {
          area?: string | null
          challenge_date?: string
          challenge_type?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          student_id?: string
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          created_at: string | null
          id: string
          nivel: string | null
          results: Json | null
          student_id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nivel?: string | null
          results?: Json | null
          student_id: string
          subject: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nivel?: string | null
          results?: Json | null
          student_id?: string
          subject?: string
        }
        Relationships: []
      }
      diagnosticos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          nivel_riesgo: string | null
          respuestas: Json
          resultado: Json | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          nivel_riesgo?: string | null
          respuestas?: Json
          resultado?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          nivel_riesgo?: string | null
          respuestas?: Json
          resultado?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          admin_id: string | null
          city: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          department: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          retired_teacher_code: string | null
          status: string | null
          student_code: string | null
          teacher_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_id?: string | null
          city?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          retired_teacher_code?: string | null
          status?: string | null
          student_code?: string | null
          teacher_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_id?: string | null
          city?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          retired_teacher_code?: string | null
          status?: string | null
          student_code?: string | null
          teacher_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          host_id: string
          id: string
          institution_id: string | null
          lugar: string | null
          meet_link: string | null
          meet_url: string | null
          meeting_url: string | null
          notes: string | null
          recordatorio_1h: boolean | null
          recordatorio_24h: boolean | null
          scheduled_at: string
          status: string | null
          student_id: string | null
          tipo: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_id: string
          id?: string
          institution_id?: string | null
          lugar?: string | null
          meet_link?: string | null
          meet_url?: string | null
          meeting_url?: string | null
          notes?: string | null
          recordatorio_1h?: boolean | null
          recordatorio_24h?: boolean | null
          scheduled_at: string
          status?: string | null
          student_id?: string | null
          tipo?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_id?: string
          id?: string
          institution_id?: string | null
          lugar?: string | null
          meet_link?: string | null
          meet_url?: string | null
          meeting_url?: string | null
          notes?: string | null
          recordatorio_1h?: boolean | null
          recordatorio_24h?: boolean | null
          scheduled_at?: string
          status?: string | null
          student_id?: string | null
          tipo?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apodo_estudiante: string | null
          created_at: string | null
          diagnostico_academico: Json | null
          diagnostico_completado: boolean | null
          diagnostico_descripcion: string | null
          diagnostico_emocional: Json | null
          diagnostico_intereses: string | null
          diagnostico_motivacion: Json | null
          diagnostico_necesidad: string | null
          diagnostico_preocupacion: string | null
          diagnostico_social: Json | null
          diagnostico_ultima_fecha: string | null
          email: string | null
          full_name: string | null
          grade: string | null
          grado: string | null
          id: string
          institution_id: string | null
          last_sign_in_at: string | null
          location: string | null
          nombre_ia: string | null
          onboarding_completado: boolean | null
          onboarding_paso_actual: number | null
          phone: string | null
          subjects: string | null
          teacher_type: string | null
          updated_at: string | null
        }
        Insert: {
          apodo_estudiante?: string | null
          created_at?: string | null
          diagnostico_academico?: Json | null
          diagnostico_completado?: boolean | null
          diagnostico_descripcion?: string | null
          diagnostico_emocional?: Json | null
          diagnostico_intereses?: string | null
          diagnostico_motivacion?: Json | null
          diagnostico_necesidad?: string | null
          diagnostico_preocupacion?: string | null
          diagnostico_social?: Json | null
          diagnostico_ultima_fecha?: string | null
          email?: string | null
          full_name?: string | null
          grade?: string | null
          grado?: string | null
          id: string
          institution_id?: string | null
          last_sign_in_at?: string | null
          location?: string | null
          nombre_ia?: string | null
          onboarding_completado?: boolean | null
          onboarding_paso_actual?: number | null
          phone?: string | null
          subjects?: string | null
          teacher_type?: string | null
          updated_at?: string | null
        }
        Update: {
          apodo_estudiante?: string | null
          created_at?: string | null
          diagnostico_academico?: Json | null
          diagnostico_completado?: boolean | null
          diagnostico_descripcion?: string | null
          diagnostico_emocional?: Json | null
          diagnostico_intereses?: string | null
          diagnostico_motivacion?: Json | null
          diagnostico_necesidad?: string | null
          diagnostico_preocupacion?: string | null
          diagnostico_social?: Json | null
          diagnostico_ultima_fecha?: string | null
          email?: string | null
          full_name?: string | null
          grade?: string | null
          grado?: string | null
          id?: string
          institution_id?: string | null
          last_sign_in_at?: string | null
          location?: string | null
          nombre_ia?: string | null
          onboarding_completado?: boolean | null
          onboarding_paso_actual?: number | null
          phone?: string | null
          subjects?: string | null
          teacher_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      solicitudes_jubilado: {
        Row: {
          creado_en: string | null
          creado_por: string | null
          docente_jubilado_id: string
          estado: string
          estudiante_id: string
          id: string
          institution_id: string
          mensaje: string | null
          respondido_en: string | null
          updated_at: string | null
          visto: boolean
        }
        Insert: {
          creado_en?: string | null
          creado_por?: string | null
          docente_jubilado_id: string
          estado?: string
          estudiante_id: string
          id?: string
          institution_id: string
          mensaje?: string | null
          respondido_en?: string | null
          updated_at?: string | null
          visto?: boolean
        }
        Update: {
          creado_en?: string | null
          creado_por?: string | null
          docente_jubilado_id?: string
          estado?: string
          estudiante_id?: string
          id?: string
          institution_id?: string
          mensaje?: string | null
          respondido_en?: string | null
          updated_at?: string | null
          visto?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_jubilado_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_jubilado_docente_id_fkey"
            columns: ["docente_jubilado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_jubilado_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_jubilado_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement_id: string
          id: string
          seen: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          seen?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          seen?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activities: {
        Row: {
          area: string
          completed_at: string | null
          created_at: string | null
          id: string
          level: string | null
          questions: Json | null
          score: number | null
          status: string
          student_id: string
          title: string | null
          xp_earned: number | null
        }
        Insert: {
          area: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          questions?: Json | null
          score?: number | null
          status?: string
          student_id: string
          title?: string | null
          xp_earned?: number | null
        }
        Update: {
          area?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          questions?: Json | null
          score?: number | null
          status?: string
          student_id?: string
          title?: string | null
          xp_earned?: number | null
        }
        Relationships: []
      }
      student_notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          student_id: string
          title: string
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          student_id: string
          title: string
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          student_id?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          energy: number
          last_active_date: string | null
          level: number
          skill_creative: number
          skill_critical: number
          skill_researcher: number
          streak_days: number
          updated_at: string | null
          user_id: string
          xp_total: number
        }
        Insert: {
          created_at?: string | null
          energy?: number
          last_active_date?: string | null
          level?: number
          skill_creative?: number
          skill_critical?: number
          skill_researcher?: number
          streak_days?: number
          updated_at?: string | null
          user_id: string
          xp_total?: number
        }
        Update: {
          created_at?: string | null
          energy?: number
          last_active_date?: string | null
          level?: number
          skill_creative?: number
          skill_critical?: number
          skill_researcher?: number
          streak_days?: number
          updated_at?: string | null
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _try_unlock_achievement: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      add_xp: {
        Args: {
          _amount: number
          _description?: string
          _reference_id?: string
          _source: string
        }
        Returns: {
          created_at: string | null
          energy: number
          last_active_date: string | null
          level: number
          skill_creative: number
          skill_critical: number
          skill_researcher: number
          streak_days: number
          updated_at: string | null
          user_id: string
          xp_total: number
        }
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_level: { Args: { xp: number }; Returns: number }
      evaluate_achievements: { Args: { _user_id: string }; Returns: undefined }
      get_pending_achievements: {
        Args: never
        Returns: {
          code: string
          description: string
          icon: string
          id: string
          title: string
          unlocked_at: string
          xp_reward: number
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      mark_achievements_seen: { Args: { _ids: string[] }; Returns: undefined }
      regenerate_institution_code: {
        Args: { _institution_id: string; _which: string }
        Returns: string
      }
      touch_last_sign_in: { Args: never; Returns: undefined }
      unlock_achievement: { Args: { _code: string }; Returns: boolean }
      update_streak: {
        Args: never
        Returns: {
          created_at: string | null
          energy: number
          last_active_date: string | null
          level: number
          skill_creative: number
          skill_critical: number
          skill_researcher: number
          streak_days: number
          updated_at: string | null
          user_id: string
          xp_total: number
        }
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
