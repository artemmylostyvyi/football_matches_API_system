// Union types
export type UserRole = 'admin' | 'coach' | 'fan';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type MatchStatus = 'scheduled' | 'in_progress' | 'finished';

// Row types
export type User = {
  id: number;
  email: string;
  password_hash: string;  // We store it in the database. We will never return it in API responses!
  role: UserRole;
  created_at: string;     // TIMESTAMP повертається як string з pg
};

export type SafeUser = {
  id: number;
  email: string;
  role: UserRole;
  created_at?: string;
};

export type JwtPayload = {
  userId: number;
  role: UserRole;
  iat?: number;  // issued at (коли створено токен)
  exp?: number;  // expiration (коли закінчується термін дії)
};

export type Tournament = {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;  // може бути null через ON DELETE SET NULL
  created_at: string;
  creator_email?: string | null; // додається через JOIN з users
};

export type Team = {
  id: number;
  name: string;
  description: string | null;
  coach_id: number | null;     // може бути null
  created_at: string;
  coach_email?: string | null; // додається через JOIN з users
};

export type Application = {
  id: number;
  tournament_id: number;
  team_id: number;
  status: ApplicationStatus;
  created_at: string;
  tournament_name?: string;
  team_name?: string;
  coach_email?: string | null;
};

export type Match = {
  id: number;
  tournament_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string | null;
  status: MatchStatus;
  home_score: number;
  away_score: number;
  created_at: string;
  tournament_name?: string;
  home_team_name?: string;
  away_team_name?: string;
};

export interface RegisterBody {
  email: string;
  password: string;
  role?: UserRole; // опціональний - якщо не вказано, можна розглянути дефолт
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateTournamentBody {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTeamBody {
  name: string;
  description?: string;
}

export interface CreateApplicationBody {
  tournament_id: number;
  team_id: number;
}

export interface CreateMatchBody {
  tournament_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date?: string;
}

export interface UpdateMatchResultBody {
  home_score?: number;
  away_score?: number;
  status?: MatchStatus;
}

export interface UpdateApplicationStatusBody {
  status: ApplicationStatus;
}

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
  results?: number;
  message?: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}
