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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_records: {
        Row: {
          grade_value: number
          id: string
          notes: string | null
          period: string
          recorded_at: string
          student_id: string
          subject: string
        }
        Insert: {
          grade_value?: number
          id?: string
          notes?: string | null
          period?: string
          recorded_at?: string
          student_id: string
          subject: string
        }
        Update: {
          grade_value?: number
          id?: string
          notes?: string | null
          period?: string
          recorded_at?: string
          student_id?: string
          subject?: string
        }
        Relationships: []
      }
      account_status: {
        Row: {
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      actividades: {
        Row: {
          creado_en: string
          dificultad: string
          docente_id: string
          docente_nombre: string | null
          estado: string
          id: string
          institution_id: string | null
          materia: string
          num_preguntas: number
          preguntas: Json
          tema: string | null
          titulo: string
        }
        Insert: {
          creado_en?: string
          dificultad: string
          docente_id: string
          docente_nombre?: string | null
          estado?: string
          id?: string
          institution_id?: string | null
          materia: string
          num_preguntas?: number
          preguntas?: Json
          tema?: string | null
          titulo: string
        }
        Update: {
          creado_en?: string
          dificultad?: string
          docente_id?: string
          docente_nombre?: string | null
          estado?: string
          id?: string
          institution_id?: string | null
          materia?: string
          num_preguntas?: number
          preguntas?: Json
          tema?: string | null
          titulo?: string
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
          completada: boolean
          enviada_en: string
          estudiante_id: string
          fecha_realizacion: string | null
          id: string
          puntaje: number | null
          respuestas: Json | null
        }
        Insert: {
          actividad_id: string
          completada?: boolean
          enviada_en?: string
          estudiante_id: string
          fecha_realizacion?: string | null
          id?: string
          puntaje?: number | null
          respuestas?: Json | null
        }
        Update: {
          actividad_id?: string
          completada?: boolean
          enviada_en?: string
          estudiante_id?: string
          fecha_realizacion?: string | null
          id?: string
          puntaje?: number | null
          respuestas?: Json | null
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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          content: string
          expires_at: string | null
          generated_at: string
          id: string
          is_read: boolean
          priority: string
          student_id: string
          title: string
          type: string
        }
        Insert: {
          content: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          is_read?: boolean
          priority?: string
          student_id: string
          title: string
          type: string
        }
        Update: {
          content?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          is_read?: boolean
          priority?: string
          student_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      asignaciones: {
        Row: {
          creado_en: string
          creado_por: string | null
          docente_id: string
          estudiante_id: string
          id: string
          institution_id: string
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          docente_id: string
          estudiante_id: string
          id?: string
          institution_id: string
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          docente_id?: string
          estudiante_id?: string
          id?: string
          institution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      attendance: {
        Row: {
          date: string
          id: string
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          date?: string
          id?: string
          notes?: string | null
          status?: string
          student_id: string
        }
        Update: {
          date?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          created_at: string
          id: string
          results: Json
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results?: Json
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json
          student_id?: string
        }
        Relationships: []
      }
      diagnosticos: {
        Row: {
          created_at: string
          id: string
          respuestas: Json
          resultado: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          respuestas?: Json
          resultado?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          respuestas?: Json
          resultado?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          status: string
          student_code: string | null
          teacher_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          status?: string
          student_code?: string | null
          teacher_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          status?: string
          student_code?: string | null
          teacher_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          meet_link: string | null
          notes: string | null
          recordatorio_1h: boolean
          recordatorio_24h: boolean
          scheduled_at: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id: string
          id?: string
          meet_link?: string | null
          notes?: string | null
          recordatorio_1h?: boolean
          recordatorio_24h?: boolean
          scheduled_at: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          meet_link?: string | null
          notes?: string | null
          recordatorio_1h?: boolean
          recordatorio_24h?: boolean
          scheduled_at?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
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
          assigned_teacher_id: string | null
          avatar_url: string | null
          created_at: string
          description: string | null
          diagnostico_completado: boolean
          diagnostico_descripcion: string | null
          diagnostico_intereses: string[] | null
          diagnostico_necesidad: string | null
          diagnostico_preocupacion: string | null
          email: string | null
          full_name: string
          grade: string | null
          grado: string | null
          id: string
          institution: string | null
          institution_id: string | null
          last_sign_in_at: string | null
          location: string | null
          nombre_ia: string | null
          onboarding_completado: boolean
          onboarding_paso_actual: number
          phone: string | null
          subjects: string | null
          teacher_type: string | null
          updated_at: string
        }
        Insert: {
          apodo_estudiante?: string | null
          assigned_teacher_id?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          diagnostico_completado?: boolean
          diagnostico_descripcion?: string | null
          diagnostico_intereses?: string[] | null
          diagnostico_necesidad?: string | null
          diagnostico_preocupacion?: string | null
          email?: string | null
          full_name?: string
          grade?: string | null
          grado?: string | null
          id: string
          institution?: string | null
          institution_id?: string | null
          last_sign_in_at?: string | null
          location?: string | null
          nombre_ia?: string | null
          onboarding_completado?: boolean
          onboarding_paso_actual?: number
          phone?: string | null
          subjects?: string | null
          teacher_type?: string | null
          updated_at?: string
        }
        Update: {
          apodo_estudiante?: string | null
          assigned_teacher_id?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          diagnostico_completado?: boolean
          diagnostico_descripcion?: string | null
          diagnostico_intereses?: string[] | null
          diagnostico_necesidad?: string | null
          diagnostico_preocupacion?: string | null
          email?: string | null
          full_name?: string
          grade?: string | null
          grado?: string | null
          id?: string
          institution?: string | null
          institution_id?: string | null
          last_sign_in_at?: string | null
          location?: string | null
          nombre_ia?: string | null
          onboarding_completado?: boolean
          onboarding_paso_actual?: number
          phone?: string | null
          subjects?: string | null
          teacher_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_jubilado: {
        Row: {
          creado_en: string
          creado_por: string | null
          docente_jubilado_id: string
          estado: string
          estudiante_id: string
          id: string
          institution_id: string
          updated_at: string
          visto: boolean
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          docente_jubilado_id: string
          estado?: string
          estudiante_id: string
          id?: string
          institution_id: string
          updated_at?: string
          visto?: boolean
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          docente_jubilado_id?: string
          estado?: string
          estudiante_id?: string
          id?: string
          institution_id?: string
          updated_at?: string
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
            foreignKeyName: "solicitudes_jubilado_docente_jubilado_id_fkey"
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
      student_gamification: {
        Row: {
          badges_earned: string[]
          id: string
          level: number
          student_id: string
          updated_at: string
          xp: number
        }
        Insert: {
          badges_earned?: string[]
          id?: string
          level?: number
          student_id: string
          updated_at?: string
          xp?: number
        }
        Update: {
          badges_earned?: string[]
          id?: string
          level?: number
          student_id?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      student_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          sender_id: string | null
          student_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          sender_id?: string | null
          student_id: string
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          sender_id?: string | null
          student_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      student_risk: {
        Row: {
          ai_note: string | null
          computed_at: string
          factors: Json
          institution_id: string | null
          risk_level: string
          risk_score: number
          user_id: string
        }
        Insert: {
          ai_note?: string | null
          computed_at?: string
          factors?: Json
          institution_id?: string | null
          risk_level?: string
          risk_score?: number
          user_id: string
        }
        Update: {
          ai_note?: string | null
          computed_at?: string
          factors?: Json
          institution_id?: string | null
          risk_level?: string
          risk_score?: number
          user_id?: string
        }
        Relationships: []
      }
      subject_diagnostics: {
        Row: {
          created_at: string
          cuestionario: Json
          ejercicios: Json
          id: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cuestionario?: Json
          ejercicios?: Json
          id?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          cuestionario?: Json
          ejercicios?: Json
          id?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      subject_journeys: {
        Row: {
          camino: Json
          created_at: string
          current_level: number
          id: string
          mensaje_motivacional: string | null
          nivel: string
          perfil: string | null
          subject: string
          temas_a_reforzar: Json
          temas_fuertes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          camino?: Json
          created_at?: string
          current_level?: number
          id?: string
          mensaje_motivacional?: string | null
          nivel?: string
          perfil?: string | null
          subject: string
          temas_a_reforzar?: Json
          temas_fuertes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          camino?: Json
          created_at?: string
          current_level?: number
          id?: string
          mensaje_motivacional?: string | null
          nivel?: string
          perfil?: string | null
          subject?: string
          temas_a_reforzar?: Json
          temas_fuertes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subject_level_progress: {
        Row: {
          completed_at: string
          id: string
          level_index: number
          score: Json
          subject: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          level_index: number
          score?: Json
          subject: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          level_index?: number
          score?: Json
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_institution_code: { Args: { prefix: string }; Returns: string }
      get_user_institution: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      regenerate_institution_code: {
        Args: { _institution_id: string; _which: string }
        Returns: string
      }
      student_has_actividad: {
        Args: { _actividad_id: string; _user_id: string }
        Returns: boolean
      }
      touch_last_sign_in: { Args: never; Returns: undefined }
      validate_institution_code: {
        Args: { _code: string }
        Returns: {
          code_type: string
          id: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "institution" | "super_admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "institution", "super_admin"],
    },
  },
} as const
