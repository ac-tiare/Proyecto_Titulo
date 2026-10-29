export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  surname: string | null;
  email: string;
}

export interface AuthCredentials {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
}

export interface RegisterRequest {
  name: string;
  surname?: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name: string;
  surname?: string | null;
  email: string;
}

export type MoodId =
  | 'muy-bien'
  | 'bien'
  | 'mas-o-menos'
  | 'mal'
  | 'muy-mal';

export type EmotionId =
  | 'tristeza'
  | 'ansiedad'
  | 'miedo'
  | 'enojo'
  | 'soledad'
  | 'calma'
  | 'esperanza'
  | 'otra';

export interface EmotionalRecord {
  id: string;
  moodId: MoodId;
  emotionIds: EmotionId[];
  note: string;
  otherEmotion: string;
  date: string;
  dateTimestamp: number;
}

export interface EmotionalRecordRequest {
  moodId: MoodId;
  emotionIds: EmotionId[];
  note?: string;
  otherEmotion?: string;
}

export interface Page<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type EmotionalPeriod = 'week' | 'month' | 'year';

export interface EmotionalPatterns {
  period: EmotionalPeriod;
  recordCount: number;
  moodCounts: Record<MoodId, number>;
  emotionCounts: Record<EmotionId, number>;
  buckets: Array<{
    startDate: string;
    recordCount: number;
    moodCounts: Partial<Record<MoodId, number>>;
    emotionCounts: Partial<Record<EmotionId, number>>;
  }>;
  hasTemporalComparison: boolean;
}

export interface SafetyPlan {
  id: string;
  warningSigns: string[];
  copingActions: string[];
  safePlaces: string[];
  updatedAt: string;
}

export type SafetyPlanRequest = Omit<SafetyPlan, 'id' | 'updatedAt'>;

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string | null;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrustedContactRequest {
  name: string;
  phone: string;
  relationship?: string | null;
  details?: string | null;
}
