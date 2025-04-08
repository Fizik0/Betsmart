import { 
  User, InsertUser, users, 
  sports, Sport, InsertSport,
  events, Event, InsertEvent,
  bets, Bet, InsertBet,
  recommendations, Recommendation, InsertRecommendation,
  liveStreams, LiveStream, InsertLiveStream,
  liveStreamStats, LiveStreamStats, InsertLiveStreamStats,
  OddsType, StatsType
} from "@shared/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "./db";
import { log } from "./vite";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, newBalance: number): Promise<User>;
  
  // Sports methods
  getAllSports(): Promise<Sport[]>;
  getSport(id: number): Promise<Sport | undefined>;
  createSport(sport: InsertSport): Promise<Sport>;
  
  // Events methods
  getEvent(id: number): Promise<Event | undefined>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  getLiveEvents(): Promise<Event[]>;
  getEventsBySport(sportId: number): Promise<Event[]>;
  getEventsBySportAndLiveStatus(sportId: number, isLive: boolean): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event>;
  
  // Bets methods
  getBet(id: number): Promise<Bet | undefined>;
  getUserBets(userId: number): Promise<Bet[]>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateBetStatus(id: number, status: string): Promise<Bet>;
  
  // Recommendations methods
  getRecommendations(limit?: number): Promise<Recommendation[]>;
  getRecommendationsByEvent(eventId: number): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  
  // LiveStream video methods
  getLiveStreams(eventId?: number): Promise<LiveStream[]>;
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  updateLiveStream(id: number, stream: Partial<LiveStream>): Promise<LiveStream>;
  getLiveStreamByEvent(eventId: number): Promise<LiveStream | undefined>;
  
  // LiveStream stats methods
  getLiveStreamStats(eventId: number): Promise<LiveStreamStats | undefined>;
  createOrUpdateLiveStreamStats(eventId: number, stats: StatsType): Promise<LiveStreamStats>;
  
  // Seed data (for demo purposes)
  seedInitialData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sports: Map<number, Sport>;
  private events: Map<number, Event>;
  private bets: Map<number, Bet>;
  private recommendations: Map<number, Recommendation>;
  private liveStreams: Map<number, LiveStream>;
  private liveStreamStats: Map<number, LiveStreamStats>;
  
  private userCurrentId: number;
  private sportCurrentId: number;
  private eventCurrentId: number;
  private betCurrentId: number;
  private recommendationCurrentId: number;
  private liveStreamCurrentId: number;
  private liveStreamStatsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.sports = new Map();
    this.events = new Map();
    this.bets = new Map();
    this.recommendations = new Map();
    this.liveStreams = new Map();
    this.liveStreamStats = new Map();
    
    this.userCurrentId = 1;
    this.sportCurrentId = 1;
    this.eventCurrentId = 1;
    this.betCurrentId = 1;
    this.recommendationCurrentId = 1;
    this.liveStreamCurrentId = 1;
    this.liveStreamStatsCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      balance: 250, // Starting balance for new users
      createdAt: now,
      fullName: insertUser.fullName || null,
      language: insertUser.language || "en"
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(id: number, newBalance: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, balance: newBalance };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Sports methods
  async getAllSports(): Promise<Sport[]> {
    try {
      // Импортируем Sports из sports-hierarchy и возвращаем преобразованные объекты
      const { Sports } = await import('../shared/sports-hierarchy');
      
      // Преобразуем объекты из Sports в тип Sport
      const sportsList: Sport[] = Sports.map(sport => ({
        id: sport.id,
        name: sport.name,
        icon: sport.icon,
        displayOrder: sport.displayOrder ?? 0,
        isPopular: sport.isPopular ?? false
      }));
      
      return sportsList;
    } catch (error) {
      console.error("Error fetching sports:", error);
      return Array.from(this.sports.values());
    }
  }
  
  async getSport(id: number): Promise<Sport | undefined> {
    return this.sports.get(id);
  }
  
  async createSport(sport: InsertSport): Promise<Sport> {
    const id = this.sportCurrentId++;
    const newSport: Sport = { ...sport, id };
    this.sports.set(id, newSport);
    return newSport;
  }

  // Events methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const now = new Date();
    
    return Array.from(this.events.values())
      .filter(event => 
        new Date(event.startTime) > now && 
        !event.isLive && 
        event.status === "upcoming"
      )
      .sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      .slice(0, limit);
  }
  
  async getLiveEvents(): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.isLive)
      .sort((a, b) => (a.liveMinute || 0) - (b.liveMinute || 0));
  }
  
  async getEventsBySport(sportId: number): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.sportId === sportId)
      .sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  }
  
  async getEventsBySportAndLiveStatus(sportId: number, isLive: boolean): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.sportId === sportId && event.isLive === isLive)
      .sort((a, b) => {
        if (isLive) {
          return (a.liveMinute || 0) - (b.liveMinute || 0);
        }
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventCurrentId++;
    const now = new Date();
    const newEvent: Event = { 
      ...event, 
      id, 
      createdAt: now,
      status: event.status || "upcoming",
      isLive: event.isLive || false,
      liveMinute: event.liveMinute || null,
      homeScore: event.homeScore || null,
      awayScore: event.awayScore || null,
      popular: event.popular || false,
      hasLiveStream: event.hasLiveStream || false
    };
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const event = await this.getEvent(id);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Bets methods
  async getBet(id: number): Promise<Bet | undefined> {
    return this.bets.get(id);
  }
  
  async getUserBets(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter(bet => bet.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  
  async createBet(bet: InsertBet): Promise<Bet> {
    const id = this.betCurrentId++;
    const now = new Date();
    const newBet: Bet = { 
      ...bet, 
      id, 
      createdAt: now, 
      settledAt: null,
      status: bet.status || "pending"
    };
    this.bets.set(id, newBet);
    return newBet;
  }
  
  async updateBetStatus(id: number, status: string): Promise<Bet> {
    const bet = await this.getBet(id);
    if (!bet) {
      throw new Error("Bet not found");
    }
    
    const now = new Date();
    const updatedBet = { 
      ...bet, 
      status, 
      settledAt: status !== "pending" ? now : null 
    };
    
    this.bets.set(id, updatedBet);
    return updatedBet;
  }

  // Recommendations methods
  async getRecommendations(limit: number = 3): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }
  
  async getRecommendationsByEvent(eventId: number): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.eventId === eventId)
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.recommendationCurrentId++;
    const now = new Date();
    const newRec: Recommendation = { 
      ...recommendation, 
      id, 
      createdAt: now,
      reasoning: recommendation.reasoning || null,
      isTrending: recommendation.isTrending || false,
      isValueBet: recommendation.isValueBet || false
    };
    this.recommendations.set(id, newRec);
    return newRec;
  }

  // LiveStream video methods
  async getLiveStreams(eventId?: number): Promise<LiveStream[]> {
    const streams = Array.from(this.liveStreams.values());
    
    if (eventId) {
      return streams.filter(stream => stream.eventId === eventId);
    }
    
    return streams;
  }
  
  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> {
    const id = this.liveStreamCurrentId++;
    const now = new Date();
    const newStream: LiveStream = { 
      ...stream, 
      id, 
      title: stream.title || `Event #${stream.eventId} Stream`,
      status: stream.status || 'active',
      startedAt: now,
      endedAt: null,
      isActive: true,
      streamType: stream.streamType || 'hls',
      quality: stream.quality || '720p',
      hlsUrl: stream.hlsUrl || null,
      fallbackUrl: stream.fallbackUrl || null,
      availableQualities: stream.availableQualities || null,
      posterUrl: stream.posterUrl || null
    };
    this.liveStreams.set(id, newStream);
    return newStream;
  }
  
  async updateLiveStream(id: number, updates: Partial<LiveStream>): Promise<LiveStream> {
    const stream = this.liveStreams.get(id);
    if (!stream) {
      throw new Error("Live stream not found");
    }
    
    const updatedStream = { ...stream, ...updates };
    this.liveStreams.set(id, updatedStream);
    return updatedStream;
  }
  
  async getLiveStreamByEvent(eventId: number): Promise<LiveStream | undefined> {
    return Array.from(this.liveStreams.values()).find(
      stream => stream.eventId === eventId && stream.isActive
    );
  }
  
  // LiveStream stats methods
  async getLiveStreamStats(eventId: number): Promise<LiveStreamStats | undefined> {
    return Array.from(this.liveStreamStats.values())
      .find(stats => stats.eventId === eventId);
  }
  
  async createOrUpdateLiveStreamStats(eventId: number, stats: StatsType): Promise<LiveStreamStats> {
    const existingStats = await this.getLiveStreamStats(eventId);
    const now = new Date();
    
    if (existingStats) {
      const updatedStats: LiveStreamStats = { 
        ...existingStats, 
        stats: stats as any, 
        eventStats: stats,
        highlights: existingStats.highlights || null,
        lastUpdated: now 
      };
      this.liveStreamStats.set(existingStats.id, updatedStats);
      return updatedStats;
    }
    
    const id = this.liveStreamStatsCurrentId++;
    const newStats: LiveStreamStats = { 
      id, 
      eventId, 
      stats: stats as any, 
      eventStats: stats,
      highlights: null,
      lastUpdated: now 
    };
    this.liveStreamStats.set(id, newStats);
    return newStats;
  }

  // Seed initial data for demo purposes
  async seedInitialData(): Promise<void> {
    // Seed sports
    const sportsData = [
      { name: "Soccer", icon: "sports_soccer" },
      { name: "Basketball", icon: "sports_basketball" },
      { name: "Tennis", icon: "sports_tennis" },
      { name: "Hockey", icon: "sports_hockey" },
      { name: "Baseball", icon: "sports_baseball" },
      { name: "Esports", icon: "videogame_asset" }
    ];
    
    const createdSports: Sport[] = [];
    for (const sport of sportsData) {
      createdSports.push(await this.createSport(sport));
    }
    
    // Seed events
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(now.getDate() + 2);
    
    const eventsData: InsertEvent[] = [
      // Soccer events
      {
        sportId: 1,
        league: "Premier League",
        homeTeam: "Manchester City",
        awayTeam: "Arsenal",
        startTime: now,
        isLive: true,
        liveMinute: 72,
        homeScore: 2,
        awayScore: 1,
        odds: { homeWin: 1.45, draw: 4.50, awayWin: 7.20 },
        status: "live",
        popular: true,
        hasLiveStream: true
      },
      {
        sportId: 1,
        league: "Champions League",
        homeTeam: "Real Madrid",
        awayTeam: "PSG",
        startTime: tomorrow,
        isLive: false,
        odds: { homeWin: 2.00, draw: 3.40, awayWin: 3.75 },
        status: "upcoming",
        popular: true,
        hasLiveStream: true
      },
      {
        sportId: 1,
        league: "Premier League",
        homeTeam: "Manchester United",
        awayTeam: "Liverpool",
        startTime: now,
        isLive: true,
        liveMinute: 65,
        homeScore: 1,
        awayScore: 2,
        odds: { homeWin: 2.10, draw: 3.50, awayWin: 1.70 },
        status: "live",
        popular: true,
        hasLiveStream: true
      },
      
      // Basketball events
      {
        sportId: 2,
        league: "NBA",
        homeTeam: "Warriors",
        awayTeam: "Nets",
        startTime: now,
        isLive: true,
        liveMinute: 32,
        homeScore: 78,
        awayScore: 72,
        odds: { homeWin: 1.65, awayWin: 2.25 },
        status: "live",
        popular: true,
        hasLiveStream: true
      },
      
      // Tennis events
      {
        sportId: 3,
        league: "French Open",
        homeTeam: "Djokovic",
        awayTeam: "Alcaraz",
        startTime: dayAfterTomorrow,
        isLive: false,
        odds: { homeWin: 1.90, awayWin: 1.95 },
        status: "upcoming",
        popular: true,
        hasLiveStream: false
      },
      
      // Add a few more events for each sport
      {
        sportId: 1,
        league: "La Liga",
        homeTeam: "Barcelona",
        awayTeam: "Atletico Madrid",
        startTime: tomorrow,
        isLive: false,
        odds: { homeWin: 1.85, draw: 3.50, awayWin: 4.20 },
        status: "upcoming",
        popular: false,
        hasLiveStream: false
      },
      {
        sportId: 2,
        league: "NBA",
        homeTeam: "Lakers",
        awayTeam: "Celtics",
        startTime: tomorrow,
        isLive: false,
        odds: { homeWin: 2.10, awayWin: 1.75 },
        status: "upcoming",
        popular: true,
        hasLiveStream: false
      }
    ];
    
    const createdEvents: Event[] = [];
    for (const event of eventsData) {
      createdEvents.push(await this.createEvent(event));
    }
    
    // Seed recommendations
    const recommendationsData: InsertRecommendation[] = [
      {
        eventId: 2,
        betType: "Match Result",
        selection: "Bayern Munich",
        confidence: 0.89,
        reasoning: "Bayern Munich has won 8 out of their last 10 matches against Dortmund.",
        isTrending: true,
        isValueBet: false
      },
      {
        eventId: 5,
        betType: "Match Result",
        selection: "Djokovic in Straight Sets",
        confidence: 0.76,
        reasoning: "Djokovic has been in excellent form on clay courts.",
        isTrending: false,
        isValueBet: false
      },
      {
        eventId: 7,
        betType: "Point Spread",
        selection: "Lakers +6.5",
        confidence: 0.68,
        reasoning: "Lakers have covered the spread in 7 of their last 10 matches against the Celtics.",
        isTrending: false,
        isValueBet: true
      }
    ];
    
    for (const rec of recommendationsData) {
      await this.createRecommendation(rec);
    }
    
    // Seed video streams for live events
    const liveStreams: InsertLiveStream[] = [
      {
        eventId: 1, // Manchester City vs Arsenal
        streamUrl: "https://example.com/streams/city-arsenal.m3u8",
        streamType: "hls",
        isActive: true,
        quality: "720p"
      },
      {
        eventId: 3, // Manchester United vs Liverpool
        streamUrl: "https://example.com/streams/united-liverpool.m3u8",
        streamType: "hls",
        isActive: true,
        quality: "1080p"
      },
      {
        eventId: 4, // Warriors vs Nets
        streamUrl: "https://example.com/streams/warriors-nets.webrtc",
        streamType: "webrtc",
        isActive: true,
        quality: "720p"
      }
    ];
    
    // Create live stream stats for Man City vs Arsenal
    await this.createOrUpdateLiveStreamStats(1, {
      possession: { home: 58, away: 42 },
      shots: { home: 14, away: 9 },
      shotsOnTarget: { home: 6, away: 3 },
      corners: { home: 7, away: 2 },
      fouls: { home: 10, away: 8 },
      yellowCards: { home: 1, away: 2 },
      redCards: { home: 0, away: 0 }
    });
    
    // Create live stream stats for Man United vs Liverpool
    await this.createOrUpdateLiveStreamStats(3, {
      possession: { home: 45, away: 55 },
      shots: { home: 8, away: 12 },
      shotsOnTarget: { home: 2, away: 5 },
      corners: { home: 4, away: 6 },
      fouls: { home: 9, away: 7 },
      yellowCards: { home: 2, away: 1 },
      redCards: { home: 0, away: 0 }
    });
    
    // Create live stream stats for Warriors vs Nets
    await this.createOrUpdateLiveStreamStats(4, {
      possession: { home: 52, away: 48 },
      shots: { home: 65, away: 58 },
      shotsOnTarget: { home: 32, away: 28 },
      corners: { home: 0, away: 0 },
      fouls: { home: 12, away: 15 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 }
    });
    
    // Create the video streams
    for (const stream of liveStreams) {
      await this.createLiveStream(stream);
    }
  }
}

import { db } from './db';
import { eq, and, desc, sql, lt, gt } from 'drizzle-orm';
import { log } from './vite';

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        balance: 1000, // Default balance for new users
        language: 'en', // Default language
        createdAt: new Date()
      })
      .returning();
    
    return user;
  }

  async updateUserBalance(id: number, newBalance: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async getAllSports(): Promise<Sport[]> {
    try {
      // Сначала попробуем получить данные из базы данных
      const sportsFromDb = await db.select().from(sports);
      if (sportsFromDb && sportsFromDb.length > 0) {
        return sportsFromDb;
      }
      
      // Если в базе данных нет спортов, используем данные из sports-hierarchy
      // Импортируем Sports из sports-hierarchy и возвращаем преобразованные объекты
      const { Sports } = await import('../shared/sports-hierarchy');
      
      if (Sports && Sports.length > 0) {
        // Преобразуем объекты из Sports в тип Sport
        const sportsList: Sport[] = Sports.map(sport => ({
          id: sport.id,
          name: sport.name,
          icon: sport.icon,
          displayOrder: sport.displayOrder ?? 0,
          isPopular: sport.isPopular ?? false
        }));
        
        return sportsList;
      }
      
      // Если ничего не получилось, возвращаем пустой массив
      return [];
    } catch (error) {
      console.error("Error fetching sports:", error);
      return [];
    }
  }

  async getSport(id: number): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.id, id));
    return sport;
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const [createdSport] = await db
      .insert(sports)
      .values(sport)
      .returning();
    
    return createdSport;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const { getEventById } = await import('./db-utils');
    return getEventById(id);
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const { getUpcomingEventsWithLimit } = await import('./db-utils');
    return getUpcomingEventsWithLimit(limit);
  }

  async getLiveEvents(): Promise<Event[]> {
    const { getLiveEvents } = await import('./db-utils');
    return getLiveEvents();
  }

  async getEventsBySport(sportId: number): Promise<Event[]> {
    const { getSportEvents } = await import('./db-utils');
    return getSportEvents(sportId);
  }

  async getEventsBySportAndLiveStatus(sportId: number, isLive: boolean): Promise<Event[]> {
    const { getLiveEventsForSport } = await import('./db-utils');
    return getLiveEventsForSport(sportId, isLive);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const { createEvent } = await import('./db-utils');
    return createEvent(event);
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const { updateEvent } = await import('./db-utils');
    return updateEvent(id, updates);
  }

  async getBet(id: number): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.id, id));
    return bet;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    return db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.createdAt));
  }

  async createBet(bet: InsertBet): Promise<Bet> {
    const [createdBet] = await db
      .insert(bets)
      .values({
        ...bet,
        status: bet.status || 'pending',
        createdAt: new Date(),
        settledAt: null
      })
      .returning();
    
    return createdBet;
  }

  async updateBetStatus(id: number, status: string): Promise<Bet> {
    const [updatedBet] = await db
      .update(bets)
      .set({
        status,
        settledAt: status !== 'pending' ? new Date() : null
      })
      .where(eq(bets.id, id))
      .returning();
    
    if (!updatedBet) {
      throw new Error(`Bet with ID ${id} not found`);
    }
    
    return updatedBet;
  }

  async getRecommendations(limit: number = 3): Promise<Recommendation[]> {
    return db
      .select()
      .from(recommendations)
      .orderBy(sql`RANDOM()`) // Random order for demo purposes
      .limit(limit);
  }

  async getRecommendationsByEvent(eventId: number): Promise<Recommendation[]> {
    return db
      .select()
      .from(recommendations)
      .where(eq(recommendations.eventId, eventId));
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [createdRecommendation] = await db
      .insert(recommendations)
      .values({
        ...recommendation,
        reasoning: recommendation.reasoning || null,
        isTrending: recommendation.isTrending || false,
        isValueBet: recommendation.isValueBet || false,
        createdAt: new Date()
      })
      .returning();
    
    return createdRecommendation;
  }

  async getLiveStreams(eventId?: number): Promise<LiveStream[]> {
    if (eventId) {
      return db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.eventId, eventId));
    } else {
      return db.select().from(liveStreams);
    }
  }

  async getLiveStreamByEvent(eventId: number): Promise<LiveStream | undefined> {
    const [stream] = await db
      .select()
      .from(liveStreams)
      .where(
        and(
          eq(liveStreams.eventId, eventId),
          eq(liveStreams.isActive, true)
        )
      );
    
    return stream;
  }

  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> {
    const [createdStream] = await db
      .insert(liveStreams)
      .values({
        ...stream,
        hlsUrl: stream.hlsUrl || null,
        fallbackUrl: stream.fallbackUrl || null,
        title: stream.title || `Event #${stream.eventId} Stream`,
        status: stream.status || 'active',
        startedAt: new Date(),
        endedAt: null,
        isActive: true,
        streamType: stream.streamType || 'hls',
        quality: stream.quality || '720p',
        availableQualities: stream.availableQualities || null,
        posterUrl: stream.posterUrl || null
      })
      .returning();
    
    return createdStream;
  }

  async updateLiveStream(id: number, updates: Partial<LiveStream>): Promise<LiveStream> {
    const [updatedStream] = await db
      .update(liveStreams)
      .set(updates)
      .where(eq(liveStreams.id, id))
      .returning();
    
    if (!updatedStream) {
      throw new Error(`LiveStream with ID ${id} not found`);
    }
    
    return updatedStream;
  }

  async getLiveStreamStats(eventId: number): Promise<LiveStreamStats | undefined> {
    const [stats] = await db
      .select()
      .from(liveStreamStats)
      .where(eq(liveStreamStats.eventId, eventId));
    
    return stats;
  }

  async createOrUpdateLiveStreamStats(eventId: number, stats: StatsType): Promise<LiveStreamStats> {
    // Check if stats for this event already exist
    const existingStats = await this.getLiveStreamStats(eventId);
    
    if (existingStats) {
      const [updatedStats] = await db
        .update(liveStreamStats)
        .set({
          stats: stats as any,
          eventStats: stats,
          highlights: existingStats.highlights || null,
          lastUpdated: new Date()
        })
        .where(eq(liveStreamStats.id, existingStats.id))
        .returning();
      
      return updatedStats;
    } else {
      const [newStats] = await db
        .insert(liveStreamStats)
        .values({
          eventId,
          stats: stats as any,
          eventStats: stats,
          highlights: null,
          lastUpdated: new Date()
        })
        .returning();
      
      return newStats;
    }
  }

  async seedInitialData(): Promise<void> {
    try {
      // Check if we already have data
      const sportCount = await db.select({ count: sql<number>`COUNT(*)` }).from(sports);
      if (sportCount[0].count > 0) {
        log('Initial data already exists, skipping seed', 'db');
        return;
      }

      log('Seeding initial data...', 'db');

      // Seed sports
      const sportsData = [
        { name: "Soccer", icon: "sports_soccer" },
        { name: "Basketball", icon: "sports_basketball" },
        { name: "Tennis", icon: "sports_tennis" },
        { name: "Hockey", icon: "sports_hockey" },
        { name: "Baseball", icon: "sports_baseball" },
        { name: "American Football", icon: "sports_football" },
        { name: "MMA", icon: "sports_mma" },
        { name: "Esports", icon: "videogame_asset" }
      ];
      
      await db.insert(sports).values(sportsData);
      
      // Get created sports for reference
      const createdSports = await db.select().from(sports);
      const sportMap = new Map(createdSports.map(s => [s.name, s.id]));
      
      // Seed events
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      const eventsData = [
        // Live Soccer Events (UEFA Champions League)
        {
          sportId: sportMap.get("Soccer"),
          league: "UEFA Champions League",
          homeTeam: "Bayern Munich",
          awayTeam: "Real Madrid",
          startTime: now,
          isLive: true,
          liveMinute: 72,
          homeScore: 1,
          awayScore: 1,
          odds: { homeWin: 2.20, draw: 3.50, awayWin: 3.10 },
          status: "live",
          popular: true,
          hasLiveStream: true,
          createdAt: now
        },
        {
          sportId: sportMap.get("Soccer"),
          league: "UEFA Champions League",
          homeTeam: "Paris Saint-Germain",
          awayTeam: "Manchester City",
          startTime: now,
          isLive: true,
          liveMinute: 65,
          homeScore: 2,
          awayScore: 2,
          odds: { homeWin: 2.50, draw: 3.30, awayWin: 2.70 },
          status: "live",
          popular: true,
          hasLiveStream: true,
          createdAt: now
        },
        
        // Upcoming Soccer Matches (Premier League)
        {
          sportId: sportMap.get("Soccer"),
          league: "Premier League",
          homeTeam: "Arsenal",
          awayTeam: "Liverpool",
          startTime: tomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 2.75, draw: 3.30, awayWin: 2.55 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        {
          sportId: sportMap.get("Soccer"),
          league: "Premier League",
          homeTeam: "Manchester United",
          awayTeam: "Chelsea",
          startTime: dayAfterTomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 2.40, draw: 3.30, awayWin: 2.90 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // La Liga
        {
          sportId: sportMap.get("Soccer"),
          league: "La Liga",
          homeTeam: "Barcelona",
          awayTeam: "Atletico Madrid",
          startTime: tomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.95, draw: 3.40, awayWin: 4.10 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // Serie A
        {
          sportId: sportMap.get("Soccer"),
          league: "Serie A",
          homeTeam: "Inter Milan",
          awayTeam: "Juventus",
          startTime: dayAfterTomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 2.15, draw: 3.20, awayWin: 3.40 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // Live NBA Basketball
        {
          sportId: sportMap.get("Basketball"),
          league: "NBA",
          homeTeam: "Boston Celtics",
          awayTeam: "Denver Nuggets",
          startTime: now,
          isLive: true,
          liveMinute: 32,
          homeScore: 78,
          awayScore: 72,
          odds: { homeWin: 1.65, awayWin: 2.25 },
          status: "live",
          popular: true,
          hasLiveStream: true,
          createdAt: now
        },
        {
          sportId: sportMap.get("Basketball"),
          league: "NBA",
          homeTeam: "Los Angeles Lakers",
          awayTeam: "Milwaukee Bucks",
          startTime: now,
          isLive: true,
          liveMinute: 38,
          homeScore: 92,
          awayScore: 86,
          odds: { homeWin: 1.80, awayWin: 2.05 },
          status: "live",
          popular: true,
          hasLiveStream: true,
          createdAt: now
        },
        
        // Upcoming NBA Games
        {
          sportId: sportMap.get("Basketball"),
          league: "NBA",
          homeTeam: "Phoenix Suns",
          awayTeam: "Golden State Warriors",
          startTime: tomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.90, awayWin: 1.90 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // Tennis Events - Grand Slams
        {
          sportId: sportMap.get("Tennis"),
          league: "Wimbledon",
          homeTeam: "Carlos Alcaraz",
          awayTeam: "Novak Djokovic",
          startTime: dayAfterTomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 2.10, awayWin: 1.75 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        {
          sportId: sportMap.get("Tennis"),
          league: "Wimbledon",
          homeTeam: "Iga Swiatek",
          awayTeam: "Coco Gauff",
          startTime: dayAfterTomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.60, awayWin: 2.35 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // NHL Hockey
        {
          sportId: sportMap.get("Hockey"),
          league: "NHL",
          homeTeam: "Boston Bruins",
          awayTeam: "Toronto Maple Leafs",
          startTime: tomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.85, draw: 3.90, awayWin: 2.10 },
          status: "upcoming",
          popular: false,
          hasLiveStream: false,
          createdAt: now
        },
        
        // MLB Baseball
        {
          sportId: sportMap.get("Baseball"),
          league: "MLB",
          homeTeam: "New York Yankees",
          awayTeam: "Los Angeles Dodgers",
          startTime: dayAfterTomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.80, awayWin: 2.05 },
          status: "upcoming",
          popular: false,
          hasLiveStream: false,
          createdAt: now
        },
        
        // NFL Football
        {
          sportId: sportMap.get("American Football"),
          league: "NFL",
          homeTeam: "Kansas City Chiefs",
          awayTeam: "San Francisco 49ers",
          startTime: nextWeek,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.70, awayWin: 2.20 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // UFC MMA
        {
          sportId: sportMap.get("MMA"),
          league: "UFC",
          homeTeam: "Alex Pereira",
          awayTeam: "Israel Adesanya",
          startTime: nextWeek,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.90, awayWin: 1.90 },
          status: "upcoming",
          popular: true,
          hasLiveStream: false,
          createdAt: now
        },
        
        // Esports
        {
          sportId: sportMap.get("Esports"),
          league: "ESL Pro League",
          homeTeam: "FaZe Clan",
          awayTeam: "G2 Esports",
          startTime: tomorrow,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          odds: { homeWin: 1.85, awayWin: 1.95 },
          status: "upcoming",
          popular: false,
          hasLiveStream: false,
          createdAt: now
        }
      ];
      
      await db.insert(events).values(eventsData);
      const insertedEvents = await db.select().from(events);
      
      // Create LiveStreams for live events
      const liveEvents = insertedEvents.filter(e => e.isLive && e.hasLiveStream);
      
      for (const event of liveEvents) {
        const streamUrl = event.sportId === sportMap.get("Soccer")
          ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          : 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
          
        const posterUrl = event.sportId === sportMap.get("Soccer")
          ? 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12' 
          : 'https://images.unsplash.com/photo-1504450758481-7338eba7524a';
          
        await this.createLiveStream({
          eventId: event.id,
          streamUrl: streamUrl,
          hlsUrl: streamUrl,
          fallbackUrl: streamUrl,
          title: `${event.homeTeam} vs ${event.awayTeam} - Live`,
          status: 'active',
          isActive: true,
          streamType: 'hls',
          quality: '720p',
          availableQualities: ['480p', '720p', '1080p'],
          posterUrl: posterUrl
        });
        
        // Also create stats
        let initialStats: StatsType = {};
        
        // Soccer stats
        if (event.sportId === sportMap.get("Soccer")) {
          initialStats = {
            possession: { home: 54, away: 46 },
            shots: { home: 12, away: 9 },
            shotsOnTarget: { home: 5, away: 3 },
            corners: { home: 6, away: 4 },
            fouls: { home: 8, away: 10 },
            yellowCards: { home: 1, away: 2 }
          };
        }
        
        // Basketball stats
        else if (event.sportId === sportMap.get("Basketball")) {
          initialStats = {
            rebounds: { home: 28, away: 25 },
            assists: { home: 18, away: 15 },
            steals: { home: 8, away: 6 },
            blocks: { home: 4, away: 5 },
            fouls: { home: 14, away: 16 }
          };
        }
        
        await db.insert(liveStreamStats).values({
          eventId: event.id,
          stats: initialStats,
          eventStats: initialStats,
          highlights: null,
          lastUpdated: now
        });
      }
      
      // Create recommendations
      const soccerEvents = insertedEvents.filter(e => e.sportId === sportMap.get("Soccer"));
      const basketballEvents = insertedEvents.filter(e => e.sportId === sportMap.get("Basketball"));
      const tennisEvents = insertedEvents.filter(e => e.sportId === sportMap.get("Tennis"));
      
      const recommendationsData = [];
      
      // Soccer recommendations
      if (soccerEvents.length >= 3) {
        recommendationsData.push({
          eventId: soccerEvents[0].id,
          betType: "Match Result",
          selection: "Draw",
          confidence: 0.78,
          reasoning: `Based on the teams' current form and their previous meetings, a draw seems likely.`,
          isTrending: true,
          isValueBet: true,
          createdAt: now
        });
        
        recommendationsData.push({
          eventId: soccerEvents[1].id,
          betType: "Both Teams to Score",
          selection: "Yes",
          confidence: 0.84,
          reasoning: `Both teams have strong attacking players and have been scoring consistently in recent matches.`,
          isTrending: true,
          isValueBet: false,
          createdAt: now
        });
        
        recommendationsData.push({
          eventId: soccerEvents[2].id,
          betType: "Over/Under",
          selection: "Over 2.5 goals",
          confidence: 0.75,
          reasoning: `The last 5 matches between these teams have averaged 3.2 goals per game.`,
          isTrending: false,
          isValueBet: true,
          createdAt: now
        });
      }
      
      // Basketball recommendations
      if (basketballEvents.length >= 2) {
        recommendationsData.push({
          eventId: basketballEvents[0].id,
          betType: "Point Spread",
          selection: `${basketballEvents[0].homeTeam} -5.5`,
          confidence: 0.82,
          reasoning: `${basketballEvents[0].homeTeam} has a strong home record and has won by an average margin of 7 points in their last 5 home games.`,
          isTrending: true,
          isValueBet: true,
          createdAt: now
        });
        
        recommendationsData.push({
          eventId: basketballEvents[1].id,
          betType: "Total Points",
          selection: "Over 215.5",
          confidence: 0.76,
          reasoning: `Both teams have high-scoring offenses, and their last 3 meetings have all gone over 220 points.`,
          isTrending: false,
          isValueBet: true,
          createdAt: now
        });
      }
      
      // Tennis recommendations
      if (tennisEvents.length >= 1) {
        recommendationsData.push({
          eventId: tennisEvents[0].id,
          betType: "Match Winner",
          selection: tennisEvents[0].homeTeam,
          confidence: 0.72,
          reasoning: `${tennisEvents[0].homeTeam} has an excellent record on this surface and has won 3 of the last 4 matches against ${tennisEvents[0].awayTeam}.`,
          isTrending: true,
          isValueBet: false,
          createdAt: now
        });
      }
      
      // Insert all recommendations
      if (recommendationsData.length > 0) {
        await db.insert(recommendations).values(recommendationsData);
      }
    } catch (error) {
      log(`Error seeding initial data: ${error}`, 'db');
      throw error;
    }
  }
}

// Now using database storage
export const storage = new DatabaseStorage();