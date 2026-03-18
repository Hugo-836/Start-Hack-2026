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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          about: string | null
          created_at: string
          description: string | null
          domains: string[]
          id: string
          name: string
          size: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          description?: string | null
          domains?: string[]
          id: string
          name: string
          size?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          description?: string | null
          domains?: string[]
          id?: string
          name?: string
          size?: string | null
        }
        Relationships: []
      }
      experts: {
        Row: {
          about: string | null
          company_id: string | null
          created_at: string
          email: string
          field_ids: string[]
          first_name: string
          id: string
          last_name: string
          objectives: Database["public"]["Enums"]["expert_objective"][]
          offer_interviews: boolean
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          about?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          field_ids?: string[]
          first_name: string
          id: string
          last_name: string
          objectives?: Database["public"]["Enums"]["expert_objective"][]
          offer_interviews?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          about?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          field_ids?: string[]
          first_name?: string
          id?: string
          last_name?: string
          objectives?: Database["public"]["Enums"]["expert_objective"][]
          offer_interviews?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_loops: {
        Row: {
          ai_summary: string | null
          created_at: string
          id: string
          project_id: string
          reviewed_at: string | null
          reviewer_feedback: string | null
          reviewer_id: string
          reviewer_type: string
          status: Database["public"]["Enums"]["feedback_status"]
          student_id: string
          submission_file_url: string | null
          submission_text: string | null
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          project_id: string
          reviewed_at?: string | null
          reviewer_feedback?: string | null
          reviewer_id: string
          reviewer_type: string
          status?: Database["public"]["Enums"]["feedback_status"]
          student_id: string
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          project_id?: string
          reviewed_at?: string | null
          reviewer_feedback?: string | null
          reviewer_id?: string
          reviewer_type?: string
          status?: Database["public"]["Enums"]["feedback_status"]
          student_id?: string
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_loops_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "thesis_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_loops_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      peer_connections: {
        Row: {
          created_at: string
          id: string
          match_reason: string | null
          shared_topics: string[] | null
          status: string
          student_a_id: string
          student_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_reason?: string | null
          shared_topics?: string[] | null
          status?: string
          student_a_id: string
          student_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_reason?: string | null
          shared_topics?: string[] | null
          status?: string
          student_a_id?: string
          student_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_connections_student_a_id_fkey"
            columns: ["student_a_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_connections_student_b_id_fkey"
            columns: ["student_b_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          nudge_sent_at: string | null
          phase: string
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"]
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          nudge_sent_at?: string | null
          phase: string
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"]
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          nudge_sent_at?: string | null
          phase?: string
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "thesis_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_milestones_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          about: string | null
          created_at: string
          degree: Database["public"]["Enums"]["degree"]
          email: string
          field_ids: string[]
          first_name: string
          id: string
          last_name: string
          objectives: Database["public"]["Enums"]["student_objective"][]
          skills: string[]
          study_program_id: string | null
          university_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          degree: Database["public"]["Enums"]["degree"]
          email: string
          field_ids?: string[]
          first_name: string
          id: string
          last_name: string
          objectives?: Database["public"]["Enums"]["student_objective"][]
          skills?: string[]
          study_program_id?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          degree?: Database["public"]["Enums"]["degree"]
          email?: string
          field_ids?: string[]
          first_name?: string
          id?: string
          last_name?: string
          objectives?: Database["public"]["Enums"]["student_objective"][]
          skills?: string[]
          study_program_id?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_study_program_id_fkey"
            columns: ["study_program_id"]
            isOneToOne: false
            referencedRelation: "study_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      study_programs: {
        Row: {
          about: string | null
          created_at: string
          degree: Database["public"]["Enums"]["degree"]
          id: string
          name: string
          university_id: string
        }
        Insert: {
          about?: string | null
          created_at?: string
          degree: Database["public"]["Enums"]["degree"]
          id: string
          name: string
          university_id: string
        }
        Update: {
          about?: string | null
          created_at?: string
          degree?: Database["public"]["Enums"]["degree"]
          id?: string
          name?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_programs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          about: string | null
          created_at: string
          email: string
          field_ids: string[]
          first_name: string
          id: string
          last_name: string
          objectives: Database["public"]["Enums"]["supervisor_objective"][]
          research_interests: string[]
          title: string | null
          university_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          email: string
          field_ids?: string[]
          first_name: string
          id: string
          last_name: string
          objectives?: Database["public"]["Enums"]["supervisor_objective"][]
          research_interests?: string[]
          title?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          email?: string
          field_ids?: string[]
          first_name?: string
          id?: string
          last_name?: string
          objectives?: Database["public"]["Enums"]["supervisor_objective"][]
          research_interests?: string[]
          title?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisors_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      thesis_projects: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          expert_ids: string[]
          id: string
          motivation: string | null
          state: Database["public"]["Enums"]["project_state"]
          student_id: string
          supervisor_ids: string[]
          title: string
          topic_id: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          expert_ids?: string[]
          id: string
          motivation?: string | null
          state?: Database["public"]["Enums"]["project_state"]
          student_id: string
          supervisor_ids?: string[]
          title: string
          topic_id?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          expert_ids?: string[]
          id?: string
          motivation?: string | null
          state?: Database["public"]["Enums"]["project_state"]
          student_id?: string
          supervisor_ids?: string[]
          title?: string
          topic_id?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thesis_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thesis_projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thesis_projects_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thesis_projects_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          company_id: string | null
          created_at: string
          degrees: Database["public"]["Enums"]["degree"][]
          description: string | null
          employment: Database["public"]["Enums"]["topic_employment"]
          employment_type:
            | Database["public"]["Enums"]["topic_employment_type"]
            | null
          expert_ids: string[]
          field_ids: string[]
          id: string
          supervisor_ids: string[]
          title: string
          type: Database["public"]["Enums"]["topic_type"]
          university_id: string | null
          workplace_type:
            | Database["public"]["Enums"]["topic_workplace_type"]
            | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          degrees?: Database["public"]["Enums"]["degree"][]
          description?: string | null
          employment?: Database["public"]["Enums"]["topic_employment"]
          employment_type?:
            | Database["public"]["Enums"]["topic_employment_type"]
            | null
          expert_ids?: string[]
          field_ids?: string[]
          id: string
          supervisor_ids?: string[]
          title: string
          type?: Database["public"]["Enums"]["topic_type"]
          university_id?: string | null
          workplace_type?:
            | Database["public"]["Enums"]["topic_workplace_type"]
            | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          degrees?: Database["public"]["Enums"]["degree"][]
          description?: string | null
          employment?: Database["public"]["Enums"]["topic_employment"]
          employment_type?:
            | Database["public"]["Enums"]["topic_employment_type"]
            | null
          expert_ids?: string[]
          field_ids?: string[]
          id?: string
          supervisor_ids?: string[]
          title?: string
          type?: Database["public"]["Enums"]["topic_type"]
          university_id?: string | null
          workplace_type?:
            | Database["public"]["Enums"]["topic_workplace_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          about: string | null
          country: string
          created_at: string
          domains: string[]
          id: string
          name: string
        }
        Insert: {
          about?: string | null
          country?: string
          created_at?: string
          domains?: string[]
          id: string
          name: string
        }
        Update: {
          about?: string | null
          country?: string
          created_at?: string
          domains?: string[]
          id?: string
          name?: string
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
      degree: "bsc" | "msc" | "phd"
      expert_objective:
        | "recruiting"
        | "fresh_insights"
        | "research_collaboration"
        | "education_collaboration"
        | "brand_visibility"
      feedback_status: "pending" | "submitted" | "reviewed" | "revised"
      milestone_status: "upcoming" | "in_progress" | "completed" | "overdue"
      project_state:
        | "proposed"
        | "applied"
        | "withdrawn"
        | "rejected"
        | "agreed"
        | "in_progress"
        | "canceled"
        | "completed"
      student_objective:
        | "topic"
        | "supervision"
        | "career_start"
        | "industry_access"
        | "project_guidance"
      supervisor_objective:
        | "student_matching"
        | "research_collaboration"
        | "network_expansion"
        | "funding_access"
        | "project_management"
      topic_employment: "yes" | "no" | "open"
      topic_employment_type:
        | "internship"
        | "working_student"
        | "graduate_program"
        | "direct_entry"
      topic_type: "topic" | "job"
      topic_workplace_type: "on_site" | "hybrid" | "remote"
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
      degree: ["bsc", "msc", "phd"],
      expert_objective: [
        "recruiting",
        "fresh_insights",
        "research_collaboration",
        "education_collaboration",
        "brand_visibility",
      ],
      feedback_status: ["pending", "submitted", "reviewed", "revised"],
      milestone_status: ["upcoming", "in_progress", "completed", "overdue"],
      project_state: [
        "proposed",
        "applied",
        "withdrawn",
        "rejected",
        "agreed",
        "in_progress",
        "canceled",
        "completed",
      ],
      student_objective: [
        "topic",
        "supervision",
        "career_start",
        "industry_access",
        "project_guidance",
      ],
      supervisor_objective: [
        "student_matching",
        "research_collaboration",
        "network_expansion",
        "funding_access",
        "project_management",
      ],
      topic_employment: ["yes", "no", "open"],
      topic_employment_type: [
        "internship",
        "working_student",
        "graduate_program",
        "direct_entry",
      ],
      topic_type: ["topic", "job"],
      topic_workplace_type: ["on_site", "hybrid", "remote"],
    },
  },
} as const
