export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  balance: number;
  language: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Sport {
  id: number;
  name: string;
  icon: string;
}

export interface Event {
  id: number;
  sportId: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  liveMinute?: number;
  homeScore?: number;
  awayScore?: number;
  odds: OddsType;
  status: string;
  popular: boolean;
  createdAt: string;
}

export interface OddsType {
  homeWin?: number;
  awayWin?: number;
  draw?: number;
  over?: number;
  under?: number;
  [key: string]: number | undefined;
}

export interface Bet {
  id: number;
  userId: number;
  eventId: number;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: string;
  settledAt?: string;
  createdAt: string;
}

export interface Recommendation {
  id: number;
  eventId: number;
  betType: string;
  selection: string;
  confidence: number;
  reasoning?: string;
  isTrending: boolean;
  isValueBet: boolean;
  createdAt: string;
  event?: Event;
}

export interface BetSlip {
  items: BetItem[];
  stake: number;
  betType: BetSlipType;
  isOpen: boolean;
  isMobileOpen: boolean;
}

export interface BetItem {
  id: string;
  eventId: number;
  sportIcon: string;
  league: string;
  eventName: string;
  betType: string;
  selection: string;
  odds: number;
}

export type BetSlipType = 'single' | 'parlay' | 'system';

export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface BestBet {
  type: string;
  selection: string;
  odds: number;
  valueRating: number;
  confidence: number;
  explanation: string;
}

export interface EventPrediction {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScore: { home: number, away: number };
  keyFactors: string[];
  bestBets: BestBet[];
  analysis: string;
}

export interface StatsType {
  possession?: { home: number, away: number };
  shots?: { home: number, away: number };
  shotsOnTarget?: { home: number, away: number };
  corners?: { home: number, away: number };
  fouls?: { home: number, away: number };
  yellowCards?: { home: number, away: number };
  redCards?: { home: number, away: number };
  [key: string]: { home: number, away: number } | undefined;
}

export interface LiveStreamStats {
  id: number;
  eventId: number;
  stats: StatsType;
  updatedAt: string;
}

export interface LiveStream {
  id: number;
  eventId: number;
  streamUrl: string;
  hlsUrl?: string;
  fallbackUrl?: string;
  posterUrl?: string;
  availableQualities?: string[];
  isActive: boolean;
  startedAt: string;
  endedAt?: string;
}
