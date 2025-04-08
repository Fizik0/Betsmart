import { apiRequest } from './queryClient';
import { User, Event, Sport, Bet, Recommendation, EventPrediction, LiveStream, LiveStreamStats } from './types';

// Auth API
export const loginUser = async (username: string, password: string): Promise<User> => {
  const response = await apiRequest('POST', '/api/login', { username, password });
  return await response.json();
};

export const registerUser = async (userData: {
  username: string;
  email: string;
  password: string;
  language?: string;
  fullName?: string;
}): Promise<User> => {
  const response = await apiRequest('POST', '/api/register', userData);
  return await response.json();
};

export const logoutUser = async (): Promise<void> => {
  await apiRequest('POST', '/api/logout', {});
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiRequest('GET', '/api/user', undefined);
    return await response.json();
  } catch (error) {
    return null;
  }
};

// Sports API
export const getAllSports = async (): Promise<Sport[]> => {
  const response = await apiRequest('GET', '/api/sports', undefined);
  return await response.json();
};

// Events API
export const getEvents = async (params?: {
  sportId?: number;
  isLive?: boolean;
}): Promise<Event[]> => {
  let url = '/api/events';
  
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.sportId) queryParams.append('sportId', params.sportId.toString());
    if (params.isLive !== undefined) queryParams.append('isLive', params.isLive.toString());
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await apiRequest('GET', url, undefined);
  return await response.json();
};

export const getEventById = async (id: number): Promise<Event> => {
  const response = await apiRequest('GET', `/api/events/${id}`, undefined);
  return await response.json();
};

export const getLiveEvents = async (sportId?: number): Promise<Event[]> => {
  return getEvents({ isLive: true, sportId });
};

export const getUpcomingEvents = async (sportId?: number): Promise<Event[]> => {
  return getEvents({ isLive: false, sportId });
};

// Bets API
export const getUserBets = async (): Promise<Bet[]> => {
  const response = await apiRequest('GET', '/api/bets', undefined);
  return await response.json();
};

export const placeBet = async (bet: {
  eventId: number;
  betType: string;
  selection: string;
  odds: number;
  stake: number;
}): Promise<Bet> => {
  const response = await apiRequest('POST', '/api/bets', bet);
  return await response.json();
};

// Recommendations API
export const getRecommendations = async (): Promise<Recommendation[]> => {
  const response = await apiRequest('GET', '/api/recommendations', undefined);
  return await response.json();
};

export const generateRecommendations = async (): Promise<Recommendation[]> => {
  const response = await apiRequest('POST', '/api/recommendations/generate', {});
  return await response.json();
};

// Utility function to combine recommendations with their events
export const getRecommendationsWithEvents = async (): Promise<(Recommendation & { event?: Event })[]> => {
  const [recommendations, events] = await Promise.all([
    getRecommendations(),
    getEvents()
  ]);
  
  return recommendations.map(rec => ({
    ...rec,
    event: events.find(event => event.id === rec.eventId)
  }));
};

// AI Predictions API
export const getEventPrediction = async (eventId: number): Promise<EventPrediction> => {
  const response = await apiRequest('GET', `/api/events/${eventId}/prediction`, undefined);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка при получении прогноза');
  }
  
  return await response.json();
};

export const getEventRecommendations = async (eventId: number): Promise<Recommendation[]> => {
  const response = await apiRequest('GET', `/api/events/${eventId}/recommendations`, undefined);
  return await response.json();
};

export const getPersonalizedRecommendations = async (): Promise<Recommendation[]> => {
  const response = await apiRequest('GET', '/api/recommendations/personalized', undefined);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка при получении персонализированных рекомендаций');
  }
  
  return await response.json();
};

// Live Streaming API
export const getEventStream = async (eventId: number): Promise<LiveStream> => {
  const response = await apiRequest('GET', `/api/events/${eventId}/stream`, undefined);
  return await response.json();
};

export const getEventStats = async (eventId: number): Promise<LiveStreamStats> => {
  const response = await apiRequest('GET', `/api/events/${eventId}/stats`, undefined);
  return await response.json();
};

export const getAllStreams = async (): Promise<LiveStream[]> => {
  const response = await apiRequest('GET', `/api/streams`, undefined);
  return await response.json();
};
