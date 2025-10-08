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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: number
          email: string
          role: 'admin' | 'super_admin'
          is_active: boolean | null
          created_at: string | null
          last_login: string | null
          auth_user_id: string | null
        }
        Insert: {
          id?: number
          email: string
          role?: 'admin' | 'super_admin'
          is_active?: boolean | null
          created_at?: string | null
          last_login?: string | null
          auth_user_id?: string | null
        }
        Update: {
          id?: number
          email?: string
          role?: 'admin' | 'super_admin'
          is_active?: boolean | null
          created_at?: string | null
          last_login?: string | null
          auth_user_id?: string | null
        }
        Relationships: []
      }
      date_participation: {
        Row: {
          actif: boolean | null
          created_at: string | null
          date_debut: string
          date_fin: string
          id: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          date_debut: string
          date_fin: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      date_vote: {
        Row: {
          actif: boolean | null
          created_at: string | null
          date_debut: string
          date_fin: string
          id: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          date_debut: string
          date_fin: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vote_categories: {
        Row: {
          id: number
          name: string
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          id: string
          video_id: string
          category_id: number
          email: string
          vote_value: number
          created_at: string | null
        }
        Insert: {
          id?: string
          video_id: string
          category_id: number
          email: string
          vote_value: number
          created_at?: string | null
        }
        Update: {
          id?: string
          video_id?: string
          category_id?: number
          email?: string
          vote_value?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "vote_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "participations"
            referencedColumns: ["id"]
          }
        ]
      }
      participations: {
        Row: {
          acceptation_reglement: boolean | null
          activite_principale: string | null
          adresse_siege_social: string | null
          attestation_dirigeant_s3_url: string | null
          attestation_regularite_s3_url: string | null
          autorisation_diffusion_video: boolean | null
          axes_progres: string | null
          capital_social: number | null
          categories_selectionnees: string[] | null
          collaboration_entreprises_adaptees: string | null
          consentement_candidature: boolean
          created_at: string | null
          date_creation: string | null
          demarche_transition_numerique: string | null
          denomination_commerciale: string | null
          description_activite: string | null
          description_clientele: string | null
          description_produits_services: string | null
          effectif_2023: number | null
          email: string
          embauche_accompagnement_handicap: string | null
          etape_actuelle: number | null
          fiche_insee_kbis_s3_url: string | null
          forme_juridique: string | null
          formulaire_complete: boolean | null
          id: string
          inclusion_handicap_approche: string | null
          inclusion_handicap_besoins: string | null
          modes_communication: string | null
          naf: string
          nom_candidat: string
          nom_etablissement: string
          nom_structure: string
          points_faibles: string | null
          points_forts: string | null
          pourcentage_travailleurs_handicap: string | null
          prenom_candidat: string
          qualite_agissant: string
          raison_participation: string | null
          signature_image_s3_url: string | null
          siret: string
          statut: string | null
          support_martinique: string | null
          telephone: string | null
          updated_at: string | null
          user_id: string | null
          video_s3_url: string | null
        }
        Insert: {
          acceptation_reglement?: boolean | null
          activite_principale?: string | null
          adresse_siege_social?: string | null
          attestation_dirigeant_s3_url?: string | null
          attestation_regularite_s3_url?: string | null
          autorisation_diffusion_video?: boolean | null
          axes_progres?: string | null
          capital_social?: number | null
          categories_selectionnees?: string[] | null
          collaboration_entreprises_adaptees?: string | null
          consentement_candidature?: boolean
          created_at?: string | null
          date_creation?: string | null
          demarche_transition_numerique?: string | null
          denomination_commerciale?: string | null
          description_activite?: string | null
          description_clientele?: string | null
          description_produits_services?: string | null
          effectif_2023?: number | null
          email: string
          embauche_accompagnement_handicap?: string | null
          etape_actuelle?: number | null
          fiche_insee_kbis_s3_url?: string | null
          forme_juridique?: string | null
          formulaire_complete?: boolean | null
          id?: string
          inclusion_handicap_approche?: string | null
          inclusion_handicap_besoins?: string | null
          modes_communication?: string | null
          naf: string
          nom_candidat: string
          nom_etablissement: string
          nom_structure: string
          points_faibles?: string | null
          points_forts?: string | null
          pourcentage_travailleurs_handicap?: string | null
          prenom_candidat: string
          qualite_agissant: string
          raison_participation?: string | null
          signature_image_s3_url?: string | null
          siret: string
          statut?: string | null
          support_martinique?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_s3_url?: string | null
        }
        Update: {
          acceptation_reglement?: boolean | null
          activite_principale?: string | null
          adresse_siege_social?: string | null
          attestation_dirigeant_s3_url?: string | null
          attestation_regularite_s3_url?: string | null
          autorisation_diffusion_video?: boolean | null
          axes_progres?: string | null
          capital_social?: number | null
          categories_selectionnees?: string[] | null
          collaboration_entreprises_adaptees?: string | null
          consentement_candidature?: boolean
          created_at?: string | null
          date_creation?: string | null
          demarche_transition_numerique?: string | null
          denomination_commerciale?: string | null
          description_activite?: string | null
          description_clientele?: string | null
          description_produits_services?: string | null
          effectif_2023?: number | null
          email?: string
          embauche_accompagnement_handicap?: string | null
          etape_actuelle?: number | null
          fiche_insee_kbis_s3_url?: string | null
          forme_juridique?: string | null
          formulaire_complete?: boolean | null
          id?: string
          inclusion_handicap_approche?: string | null
          inclusion_handicap_besoins?: string | null
          modes_communication?: string | null
          naf?: string
          nom_candidat?: string
          nom_etablissement?: string
          nom_structure?: string
          points_faibles?: string | null
          points_forts?: string | null
          pourcentage_travailleurs_handicap?: string | null
          prenom_candidat?: string
          qualite_agissant?: string
          raison_participation?: string | null
          signature_image_s3_url?: string | null
          siret?: string
          statut?: string | null
          support_martinique?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_s3_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
