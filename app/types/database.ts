export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserIssueStatus = "active" | "resolved"
export type UserIssuePriority = "high" | "medium" | "low"
export type UserIssueRelationshipType =
  | "upstream_of"
  | "downstream_of"
  | "related_to"
export type UserQualityStatus = "building" | "maintaining" | "inactive"
export type UserQualityFrequencyPeriod = "day" | "week"
export type UserConversationStatus = "active" | "archived" | "deleted"
export type UserMessageRole = "user" | "assistant" | "system"
export type UserMessageStatus = "queued" | "streaming" | "complete" | "failed"

export interface Database {
  public: {
    Tables: {
      user_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          status: UserConversationStatus
          summary: string | null
          last_message_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          status?: UserConversationStatus
          summary?: string | null
          last_message_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          status?: UserConversationStatus
          summary?: string | null
          last_message_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          role: UserMessageRole
          content: string
          status: UserMessageStatus
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          role: UserMessageRole
          content: string
          status?: UserMessageStatus
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          role?: UserMessageRole
          content?: string
          status?: UserMessageStatus
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_user_id_conversation_id_fkey"
            columns: ["user_id", "conversation_id"]
            isOneToOne: false
            referencedRelation: "user_conversations"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          user_id: string
          about_me: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          about_me?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          about_me?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_issues: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string | null
          priority: UserIssuePriority | null
          status: UserIssueStatus
          sort_key: string | null
          first_noted_at: string
          last_noted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          notes?: string | null
          priority?: UserIssuePriority | null
          status: UserIssueStatus
          sort_key?: string | null
          first_noted_at?: string
          last_noted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          notes?: string | null
          priority?: UserIssuePriority | null
          status?: UserIssueStatus
          sort_key?: string | null
          first_noted_at?: string
          last_noted_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_issue_relationships: {
        Row: {
          user_id: string
          issue_id: string
          related_issue_id: string
          relationship: UserIssueRelationshipType
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          issue_id: string
          related_issue_id: string
          relationship: UserIssueRelationshipType
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          issue_id?: string
          related_issue_id?: string
          relationship?: UserIssueRelationshipType
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_issue_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_issue_relationships_user_id_issue_id_fkey"
            columns: ["user_id", "issue_id"]
            isOneToOne: false
            referencedRelation: "user_issues"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName:
              "user_issue_relationships_user_id_related_issue_id_fkey"
            columns: ["user_id", "related_issue_id"]
            isOneToOne: false
            referencedRelation: "user_issues"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_qualities: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          body_region_id: string | null
          display_color: string | null
          sort_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          body_region_id?: string | null
          display_color?: string | null
          sort_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          body_region_id?: string | null
          display_color?: string | null
          sort_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_qualities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_qualities_user_id_body_region_id_fkey"
            columns: ["user_id", "body_region_id"]
            isOneToOne: false
            referencedRelation: "user_body_regions"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_quality_states: {
        Row: {
          id: string
          user_id: string
          quality_id: string
          status: UserQualityStatus
          training_frequency_count: number | null
          training_frequency_period: UserQualityFrequencyPeriod | null
          notes: string | null
          sort_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quality_id: string
          status: UserQualityStatus
          training_frequency_count?: number | null
          training_frequency_period?: UserQualityFrequencyPeriod | null
          notes?: string | null
          sort_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quality_id?: string
          status?: UserQualityStatus
          training_frequency_count?: number | null
          training_frequency_period?: UserQualityFrequencyPeriod | null
          notes?: string | null
          sort_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quality_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quality_states_user_id_quality_id_fkey"
            columns: ["user_id", "quality_id"]
            isOneToOne: false
            referencedRelation: "user_qualities"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_issue_quality_relationships: {
        Row: {
          user_id: string
          issue_id: string
          quality_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          issue_id: string
          quality_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          issue_id?: string
          quality_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_issue_quality_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName:
              "user_issue_quality_relationships_user_id_issue_id_fkey"
            columns: ["user_id", "issue_id"]
            isOneToOne: false
            referencedRelation: "user_issues"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName:
              "user_issue_quality_relationships_user_id_quality_id_fkey"
            columns: ["user_id", "quality_id"]
            isOneToOne: false
            referencedRelation: "user_qualities"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_exercise_types: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          display_color: string | null
          sort_key: string
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          display_color?: string | null
          sort_key: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          display_color?: string | null
          sort_key?: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_body_regions: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          display_color: string | null
          sort_key: string
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          display_color?: string | null
          sort_key: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          display_color?: string | null
          sort_key?: string
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_body_regions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exercise_type_assignments: {
        Row: {
          user_id: string
          exercise_id: string
          type_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          exercise_id: string
          type_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          exercise_id?: string
          type_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_type_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName:
              "user_exercise_type_assignments_user_id_exercise_id_fkey"
            columns: ["user_id", "exercise_id"]
            isOneToOne: false
            referencedRelation: "user_exercises"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName:
              "user_exercise_type_assignments_user_id_type_id_fkey"
            columns: ["user_id", "type_id"]
            isOneToOne: false
            referencedRelation: "user_exercise_types"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_exercise_quality_assignments: {
        Row: {
          user_id: string
          exercise_id: string
          quality_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          exercise_id: string
          quality_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          exercise_id?: string
          quality_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercise_quality_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName:
              "user_exercise_quality_assignments_user_id_exercise_id_fkey"
            columns: ["user_id", "exercise_id"]
            isOneToOne: false
            referencedRelation: "user_exercises"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName:
              "user_exercise_quality_assignments_user_id_quality_id_fkey"
            columns: ["user_id", "quality_id"]
            isOneToOne: false
            referencedRelation: "user_qualities"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string | null
          image_url: string | null
          video_url: string | null
          performance: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          notes?: string | null
          image_url?: string | null
          video_url?: string | null
          performance?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          notes?: string | null
          image_url?: string | null
          video_url?: string | null
          performance?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          name: string
          estimated_duration_mins: number | null
          date: string
          type: string
          notes: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          estimated_duration_mins?: number | null
          date?: string
          type: string
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          estimated_duration_mins?: number | null
          date?: string
          type?: string
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supersets: {
        Row: {
          id: string
          user_id: string
          session_id: string
          name: string | null
          sort_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          name?: string | null
          sort_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          name?: string | null
          sort_key?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_supersets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_supersets_user_id_session_id_fkey"
            columns: ["user_id", "session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_logged_exercises: {
        Row: {
          id: string
          user_id: string
          session_id: string
          superset_id: string | null
          exercise_id: string
          sort_key: string
          completed_at: string | null
          performance: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          superset_id?: string | null
          exercise_id: string
          sort_key: string
          completed_at?: string | null
          performance?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          superset_id?: string | null
          exercise_id?: string
          sort_key?: string
          completed_at?: string | null
          performance?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_logged_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_logged_exercises_user_id_session_id_fkey"
            columns: ["user_id", "session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "user_logged_exercises_user_id_exercise_id_fkey"
            columns: ["user_id", "exercise_id"]
            isOneToOne: false
            referencedRelation: "user_exercises"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "user_logged_exercises_user_id_superset_id_fkey"
            columns: ["user_id", "superset_id"]
            isOneToOne: false
            referencedRelation: "user_supersets"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "user_logged_exercises_session_id_superset_id_fkey"
            columns: ["session_id", "superset_id"]
            isOneToOne: false
            referencedRelation: "user_supersets"
            referencedColumns: ["session_id", "id"]
          },
        ]
      }
      user_notes: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database["public"]
type PublicTables = PublicSchema["Tables"]

export type TableName = keyof PublicTables

export type TableRow<T extends TableName> = PublicTables[T]["Row"]
export type TableInsert<T extends TableName> = PublicTables[T]["Insert"]
export type TableUpdate<T extends TableName> = PublicTables[T]["Update"]

export type UserConversation = TableRow<"user_conversations">
export type UserConversationInsert = TableInsert<"user_conversations">
export type UserConversationUpdate = TableUpdate<"user_conversations">

export type UserMessage = TableRow<"user_messages">
export type UserMessageInsert = TableInsert<"user_messages">
export type UserMessageUpdate = TableUpdate<"user_messages">

export type UserProfile = TableRow<"user_profiles">
export type UserProfileInsert = TableInsert<"user_profiles">
export type UserProfileUpdate = TableUpdate<"user_profiles">

export type UserIssue = TableRow<"user_issues">
export type UserIssueInsert = TableInsert<"user_issues">
export type UserIssueUpdate = TableUpdate<"user_issues">

export type UserIssueRelationship = TableRow<"user_issue_relationships">
export type UserIssueRelationshipInsert = TableInsert<"user_issue_relationships">
export type UserIssueRelationshipUpdate = TableUpdate<"user_issue_relationships">

export type UserQuality = TableRow<"user_qualities">
export type UserQualityInsert = TableInsert<"user_qualities">
export type UserQualityUpdate = TableUpdate<"user_qualities">

export type UserQualityState = TableRow<"user_quality_states">
export type UserQualityStateInsert = TableInsert<"user_quality_states">
export type UserQualityStateUpdate = TableUpdate<"user_quality_states">

export type UserIssueQualityRelationship =
  TableRow<"user_issue_quality_relationships">
export type UserIssueQualityRelationshipInsert =
  TableInsert<"user_issue_quality_relationships">
export type UserIssueQualityRelationshipUpdate =
  TableUpdate<"user_issue_quality_relationships">

export type UserExerciseType = TableRow<"user_exercise_types">
export type UserExerciseTypeInsert = TableInsert<"user_exercise_types">
export type UserExerciseTypeUpdate = TableUpdate<"user_exercise_types">

export type UserBodyRegion = TableRow<"user_body_regions">
export type UserBodyRegionInsert = TableInsert<"user_body_regions">
export type UserBodyRegionUpdate = TableUpdate<"user_body_regions">

export type UserExerciseTypeAssignment =
  TableRow<"user_exercise_type_assignments">
export type UserExerciseTypeAssignmentInsert =
  TableInsert<"user_exercise_type_assignments">
export type UserExerciseTypeAssignmentUpdate =
  TableUpdate<"user_exercise_type_assignments">

export type UserExerciseQualityAssignment =
  TableRow<"user_exercise_quality_assignments">
export type UserExerciseQualityAssignmentInsert =
  TableInsert<"user_exercise_quality_assignments">
export type UserExerciseQualityAssignmentUpdate =
  TableUpdate<"user_exercise_quality_assignments">

export type UserExercise = TableRow<"user_exercises">
export type UserExerciseInsert = TableInsert<"user_exercises">
export type UserExerciseUpdate = TableUpdate<"user_exercises">

export type UserSession = TableRow<"user_sessions">
export type UserSessionInsert = TableInsert<"user_sessions">
export type UserSessionUpdate = TableUpdate<"user_sessions">

export type UserSuperset = TableRow<"user_supersets">
export type UserSupersetInsert = TableInsert<"user_supersets">
export type UserSupersetUpdate = TableUpdate<"user_supersets">

export type UserLoggedExercise = TableRow<"user_logged_exercises">
export type UserLoggedExerciseInsert = TableInsert<"user_logged_exercises">
export type UserLoggedExerciseUpdate = TableUpdate<"user_logged_exercises">

export type UserNote = TableRow<"user_notes">
export type UserNoteInsert = TableInsert<"user_notes">
export type UserNoteUpdate = TableUpdate<"user_notes">
