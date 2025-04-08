import {
  User, InsertUser,
  Sport, InsertSport,
  Event, InsertEvent,
  Bet, InsertBet,
  Recommendation, InsertRecommendation,
  LiveStream, InsertLiveStream,
  LiveStreamStats,
  StatsType
} from "@shared/schema";
import { IStorage } from "./storage";
import { supabase, getAll, getById, insert, update, getByColumn, query } from "./supabase";
import { log } from "./vite";

/**
 * Implementation of IStorage that uses Supabase as the backend
 */
// Improved logger for Supabase errors
function logSupabaseError(error: any, message: string, scope: string = "supabase-error") {
  if (error) {
    try {
      log(`${message}: ${error.message || JSON.stringify(error)}`, scope);
    } catch (e) {
      // If stringify fails, just log the message
      log(`${message}: [Error object cannot be serialized]`, scope);
    }
    return true;
  }
  return false;
}

export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await getById<User>("users", id);
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await getByColumn<User>("users", "username", username);
    return users[0] || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const userData = {
      ...user,
      balance: 1000, // Default balance for new users
      language: user.language || "en", // Default language
      createdAt: new Date()
    };
    
    return await insert<User, typeof userData>("users", userData);
  }

  async updateUserBalance(id: number, newBalance: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return await update<User, User>("users", id, { balance: newBalance });
  }

  // Sports methods
  async getAllSports(): Promise<Sport[]> {
    return await getAll<Sport>("sports");
  }

  async getSport(id: number): Promise<Sport | undefined> {
    const sport = await getById<Sport>("sports", id);
    return sport || undefined;
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    return await insert<Sport, InsertSport>("sports", sport);
  }

  // Events methods
  async getEvent(id: number): Promise<Event | undefined> {
    const event = await getById<Event>("events", id);
    return event || undefined;
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const now = new Date();
    
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("isLive", false)
      .gt("startTime", now.toISOString())
      .order("startTime", { ascending: true })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return data as Event[];
  }

  async getLiveEvents(): Promise<Event[]> {
    return await getByColumn<Event>("events", "isLive", true);
  }

  async getEventsBySport(sportId: number): Promise<Event[]> {
    return await getByColumn<Event>("events", "sportId", sportId);
  }

  async getEventsBySportAndLiveStatus(sportId: number, isLive: boolean): Promise<Event[]> {
    return await query<Event>("events", { sportId, isLive });
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const eventData = {
      ...event,
      createdAt: new Date(),
      status: event.status || "upcoming",
      liveMinute: event.liveMinute || null,
      homeScore: event.homeScore || null,
      awayScore: event.awayScore || null,
      popular: event.popular || false,
      hasLiveStream: event.hasLiveStream || false
    };
    
    return await insert<Event, typeof eventData>("events", eventData);
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event> {
    const event = await this.getEvent(id);
    if (!event) {
      throw new Error(`Event with ID ${id} not found`);
    }
    
    return await update<Event, Event>("events", id, updates);
  }

  // Bets methods
  async getBet(id: number): Promise<Bet | undefined> {
    const bet = await getById<Bet>("bets", id);
    return bet || undefined;
  }

  async getUserBets(userId: number): Promise<Bet[]> {
    const { data, error } = await supabase
      .from("bets")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data as Bet[];
  }

  async createBet(bet: InsertBet): Promise<Bet> {
    const betData = {
      ...bet,
      status: bet.status || "pending",
      createdAt: new Date(),
      settledAt: null
    };
    
    return await insert<Bet, typeof betData>("bets", betData);
  }

  async updateBetStatus(id: number, status: string): Promise<Bet> {
    const bet = await this.getBet(id);
    if (!bet) {
      throw new Error(`Bet with ID ${id} not found`);
    }
    
    const updates = {
      status,
      settledAt: status !== "pending" ? new Date() : null
    };
    
    return await update<Bet, typeof updates>("bets", id, updates);
  }

  // Recommendations methods
  async getRecommendations(limit: number = 3): Promise<Recommendation[]> {
    // Using raw SQL for random ordering through Supabase's rpc
    const { data, error } = await supabase
      .rpc("get_random_recommendations", { limit_count: limit });
    
    if (error) {
      log(`Error getting random recommendations: ${error.message}`, "supabase");
      
      // Fallback to regular query without random ordering
      return await getAll<Recommendation>("recommendations", { limit });
    }
    
    return data as Recommendation[];
  }

  async getRecommendationsByEvent(eventId: number): Promise<Recommendation[]> {
    return await getByColumn<Recommendation>("recommendations", "eventId", eventId);
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const recData = {
      ...recommendation,
      reasoning: recommendation.reasoning || null,
      isTrending: recommendation.isTrending || false,
      isValueBet: recommendation.isValueBet || false,
      createdAt: new Date()
    };
    
    return await insert<Recommendation, typeof recData>("recommendations", recData);
  }

  // LiveStream video methods
  async getLiveStreams(eventId?: number): Promise<LiveStream[]> {
    if (eventId) {
      return await getByColumn<LiveStream>("live_streams", "eventId", eventId);
    } else {
      return await getAll<LiveStream>("live_streams");
    }
  }

  async getLiveStreamByEvent(eventId: number): Promise<LiveStream | undefined> {
    const { data, error } = await supabase
      .from("live_streams")
      .select("*")
      .eq("eventId", eventId)
      .eq("isActive", true)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return undefined;
      }
      throw error;
    }
    
    return data as LiveStream;
  }

  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> {
    // Ensure we have the required fields and use snake_case keys for Supabase
    const streamData = {
      event_id: stream.eventId,
      stream_url: stream.streamUrl, // Use the field that matches our schema
      stream_type: stream.streamType || "hls",
      quality: stream.quality || "720p",
      is_active: true,
      started_at: new Date(),
      ended_at: null
    };
    
    return await insert<LiveStream, typeof streamData>("live_streams", streamData);
  }

  async updateLiveStream(id: number, updates: Partial<LiveStream>): Promise<LiveStream> {
    const stream = await getById<LiveStream>("live_streams", id);
    if (!stream) {
      throw new Error(`LiveStream with ID ${id} not found`);
    }
    
    return await update<LiveStream, Partial<LiveStream>>("live_streams", id, updates);
  }

  // LiveStream stats methods
  async getLiveStreamStats(eventId: number): Promise<LiveStreamStats | undefined> {
    const { data, error } = await supabase
      .from("live_stream_stats")
      .select("*")
      .eq("event_id", eventId)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return undefined;
      }
      log(`Error getting live stream stats for event ${eventId}: ${error.message}`, "supabase-error");
      return undefined;
    }
    
    return data as LiveStreamStats;
  }

  async createOrUpdateLiveStreamStats(eventId: number, stats: StatsType): Promise<LiveStreamStats> {
    const existingStats = await this.getLiveStreamStats(eventId);
    
    if (existingStats) {
      const { data, error } = await supabase
        .from("live_stream_stats")
        .update({
          stats: stats as any,
          last_updated: new Date()
        })
        .eq("id", existingStats.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as LiveStreamStats;
    } else {
      const { data, error } = await supabase
        .from("live_stream_stats")
        .insert({
          event_id: eventId,
          stats: stats as any,
          last_updated: new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as LiveStreamStats;
    }
  }

  // Seed initial data
  // Helper method to seed live streams for existing events
  private async seedLiveStreams(events: any[], soccerId: number, basketballId: number): Promise<void> {
    try {
      log("Seeding live streams for existing events...", "supabase-debug");
      
      // Get only live events with live streams
      const liveEvents = events.filter(e => e.is_live && e.has_live_stream);
      const now = new Date();
      
      log(`Found ${liveEvents.length} live events with streams to seed`, "supabase-debug");
      
      for (const event of liveEvents) {
        try {
          // Create a live stream for the event
          log(`Creating live stream for event ID ${event.id}...`, "supabase-debug");
          
          const { error: streamError } = await supabase
            .from("live_streams")
            .insert({
              event_id: event.id,
              stream_url: event.sport_id === soccerId
                ? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                : "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              stream_type: "hls",
              quality: "720p",
              is_active: true,
              started_at: now.toISOString(),
              ended_at: null
            });
          
          if (streamError) {
            log(`Error creating live stream for event ID ${event.id}: ${streamError.message}`, "supabase-error");
            continue; // Skip to next event instead of failing completely
          }
          
          log(`Successfully created live stream for event ID ${event.id}`, "supabase-debug");
          
          // Create stats for the event
          let initialStats: StatsType = {};
          
          // Soccer stats
          if (event.sport_id === soccerId) {
            initialStats = {
              possession: { home: 54, away: 46 },
              shots: { home: 8, away: 6 },
              shotsOnTarget: { home: 3, away: 2 },
              corners: { home: 5, away: 3 },
              fouls: { home: 7, away: 9 },
              yellowCards: { home: 1, away: 2 }
            };
          }
          // Basketball stats
          else if (event.sport_id === basketballId) {
            initialStats = {
              rebounds: { home: 24, away: 22 },
              assists: { home: 15, away: 13 },
              steals: { home: 7, away: 5 },
              blocks: { home: 3, away: 4 },
              fouls: { home: 12, away: 15 }
            };
          }
          
          log(`Creating stats for event ID ${event.id}...`, "supabase-debug");
          const { error: statsError } = await supabase
            .from("live_stream_stats")
            .insert({
              event_id: event.id,
              stats: initialStats,
              last_updated: now.toISOString()
            });
          
          if (statsError) {
            log(`Error creating stats for event ID ${event.id}: ${statsError.message}`, "supabase-error");
            continue; // Skip to next event instead of failing completely
          }
          
          log(`Successfully created stats for event ID ${event.id}`, "supabase-debug");
        } catch (error: any) {
          log(`Error processing live event ${event.id}: ${error.message}`, "supabase-error");
          // Continue with next event
        }
      }
      
      log("Completed seeding live streams", "supabase-debug");
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error occurred';
      log(`Error seeding live streams: ${errorMsg}`, "supabase-error");
      // Don't rethrow, just return - allow the process to continue
      return;
    }
  }
  
  // Helper method to seed recommendations for existing events
  private async seedRecommendations(events: any[]): Promise<void> {
    try {
      if (events.length < 3) {
        log("Not enough events to create recommendations", "supabase-debug");
        return;
      }
      
      log("Seeding recommendations for existing events...", "supabase-debug");
      const now = new Date();
      
      const recommendationsData = [
        {
          event_id: events[0].id,
          bet_type: "Match Result",
          selection: events[0].home_team,
          confidence: 0.82,
          reasoning: `Based on recent form, ${events[0].home_team} has won 4 out of their last 5 home games.`,
          is_trending: true,
          is_value_bet: true,
          created_at: now.toISOString()
        },
        {
          event_id: events[1].id,
          bet_type: "Match Result",
          selection: "Draw",
          confidence: 0.67,
          reasoning: "Both teams have drawn their last 2 matches against each other.",
          is_trending: true,
          is_value_bet: false,
          created_at: now.toISOString()
        },
        {
          event_id: events[2].id,
          bet_type: "Match Result",
          selection: events[2].away_team,
          confidence: 0.73,
          reasoning: `${events[2].away_team} has a strong record against ${events[2].home_team}.`,
          is_trending: false,
          is_value_bet: true,
          created_at: now.toISOString()
        }
      ];
      
      const { error: recError } = await supabase
        .from("recommendations")
        .insert(recommendationsData);
      
      if (logSupabaseError(recError, "Error creating recommendations")) {
        // Continue with the process - don't throw here
        log("Continuing despite recommendation creation error in seedRecommendations...", "supabase");
        return; // We'll just skip creating recommendations but continue with the rest of the setup
      }
      
      log("Successfully created recommendations", "supabase-debug");
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error occurred';
      log(`Error seeding recommendations: ${errorMsg}`, "supabase-error");
      // Don't rethrow, just return - allow the process to continue
      return;
    }
  }
  
  async seedInitialData(): Promise<void> {
    try {
      log("Starting seedInitialData method", "supabase-debug");
      
      // Get existing data to determine what needs to be seeded
      const { data: existingSports } = await supabase
        .from("sports")
        .select("*");
      
      const { data: existingEvents } = await supabase
        .from("events")
        .select("*");
      
      const { data: existingLiveStreams } = await supabase
        .from("live_streams")
        .select("*")
        .limit(1);
      
      const { data: existingRecommendations } = await supabase
        .from("recommendations")
        .select("*")
        .limit(1);
      
      // If we have sports and events but no other data, we'll skip to creating those
      if (existingSports && existingSports.length > 0 && 
          existingEvents && existingEvents.length > 0) {
        
        log("Sports and events data already exists", "supabase-debug");
        
        // Create a map of sport names to IDs
        const sportMap = new Map(existingSports.map(s => [s.name, s.id]));
        
        // Make sure we have all the sport IDs
        const soccerId = sportMap.get("Soccer") || 1;
        const basketballId = sportMap.get("Basketball") || 2;
        
        // Only seed live streams if needed
        if (!existingLiveStreams || existingLiveStreams.length === 0) {
          await this.seedLiveStreams(existingEvents, soccerId, basketballId);
        } else {
          log("Live streams data already exists, skipping", "supabase-debug");
        }
        
        // Only seed recommendations if needed
        if (!existingRecommendations || existingRecommendations.length === 0) {
          await this.seedRecommendations(existingEvents);
        } else {
          log("Recommendations data already exists, skipping", "supabase-debug");
        }
        
        return;
      }
      
      log("Seeding initial data...", "supabase");
      
      // Create a batch insert for sports
      const initialSportsData = [
        { 
          name: "Soccer", 
          icon: "sports_soccer" 
        },
        { 
          name: "Basketball", 
          icon: "sports_basketball" 
        },
        { 
          name: "Tennis", 
          icon: "sports_tennis" 
        },
        { 
          name: "Hockey", 
          icon: "sports_hockey" 
        },
        { 
          name: "Baseball", 
          icon: "sports_baseball" 
        },
        { 
          name: "Esports", 
          icon: "videogame_asset" 
        }
      ];
      
      log("Inserting sports data...", "supabase-debug");
      
      // Declare variable to hold sports data
      let sports;
      
      // Try to insert
      const { data: insertedSports, error: sportsError } = await supabase
        .from("sports")
        .insert(initialSportsData)
        .select();
      
      if (logSupabaseError(sportsError, "Error inserting sports")) {
        // Continue with the process - don't throw here
        log("Continuing despite sports insertion error...", "supabase");
        // Try getting existing sports instead
        const { data: existingSports, error } = await supabase
          .from("sports")
          .select("*");
          
        if (error || !existingSports || existingSports.length === 0) {
          log("No sports data available in the database", "supabase-error");
          return; // Exit early but don't throw
        }
        
        // Use existing sports
        sports = existingSports;
      } else {
        // Use inserted sports
        sports = insertedSports;
      }
      
      if (!sports || sports.length === 0) {
        log("No sports data returned after insert", "supabase-error");
        return; // Exit early but don't throw
      }
      
      log(`Successfully inserted ${sports.length} sports`, "supabase-debug");
      
      // Create a map of sport names to IDs
      const sportMap = new Map(sports.map(s => [s.name, s.id]));
      
      // Make sure we have all the sport IDs
      const soccerId = sportMap.get("Soccer") || 1;
      const basketballId = sportMap.get("Basketball") || 2;
      const tennisId = sportMap.get("Tennis") || 3;
      
      // Log sport IDs for debugging
      log(`Sport IDs - Soccer: ${soccerId}, Basketball: ${basketballId}, Tennis: ${tennisId}`, "supabase");
      
      // Seed events
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      
      const eventsData = [
        // Soccer events
        {
          sport_id: soccerId,
          league: "Premier League",
          home_team: "Manchester City",
          away_team: "Arsenal",
          start_time: now.toISOString(),
          is_live: true,
          live_minute: 72,
          home_score: 2,
          away_score: 1,
          odds: { homeWin: 1.45, draw: 4.50, awayWin: 7.20 },
          status: "live",
          popular: true,
          has_live_stream: true,
          created_at: now.toISOString()
        },
        {
          sport_id: soccerId,
          league: "Champions League",
          home_team: "Real Madrid",
          away_team: "PSG",
          start_time: tomorrow.toISOString(),
          is_live: false,
          odds: { homeWin: 2.00, draw: 3.40, awayWin: 3.75 },
          status: "upcoming",
          popular: true,
          has_live_stream: true,
          created_at: now.toISOString()
        },
        {
          sport_id: soccerId,
          league: "Premier League",
          home_team: "Manchester United",
          away_team: "Liverpool",
          start_time: now.toISOString(),
          is_live: true,
          live_minute: 65,
          home_score: 1,
          away_score: 2,
          odds: { homeWin: 2.10, draw: 3.50, awayWin: 1.70 },
          status: "live",
          popular: true,
          has_live_stream: true,
          created_at: now.toISOString()
        },
        
        // Basketball events
        {
          sport_id: basketballId,
          league: "NBA",
          home_team: "Warriors",
          away_team: "Nets",
          start_time: now.toISOString(),
          is_live: true,
          live_minute: 32,
          home_score: 78,
          away_score: 72,
          odds: { homeWin: 1.65, awayWin: 2.25 },
          status: "live",
          popular: true,
          has_live_stream: true,
          created_at: now.toISOString()
        },
        
        // Tennis events
        {
          sport_id: tennisId,
          league: "French Open",
          home_team: "Djokovic",
          away_team: "Alcaraz",
          start_time: dayAfterTomorrow.toISOString(),
          is_live: false,
          odds: { homeWin: 1.90, awayWin: 1.95 },
          status: "upcoming",
          popular: true,
          has_live_stream: false,
          created_at: now.toISOString()
        }
      ];
      
      log("Inserting events data...", "supabase-debug");
      
      // Declare variable to hold events data
      let events;
      
      // Try to insert
      const { data: insertedEvents, error: eventsError } = await supabase
        .from("events")
        .insert(eventsData)
        .select();
      
      if (logSupabaseError(eventsError, "Error inserting events")) {
        // Continue with the process - don't throw here
        log("Continuing despite events insertion error...", "supabase");
        // Try getting existing events instead
        const { data: existingEvents, error } = await supabase
          .from("events")
          .select("*")
          .limit(5);
          
        if (error || !existingEvents || existingEvents.length === 0) {
          log("No events data available in the database", "supabase-error");
          return; // Exit early but don't throw
        }
        
        // Use existing events
        events = existingEvents;
      } else {
        // Use inserted events
        events = insertedEvents;
      }
      
      if (!events || events.length === 0) {
        log("No events data returned after insert", "supabase-error");
        return; // Exit early but don't throw
      }
      
      log(`Successfully inserted ${events.length} events`, "supabase-debug");
      
      // Create live streams for live events
      const liveEvents = events.filter(e => e.is_live && e.has_live_stream);
      
      log(`Creating live streams for ${liveEvents.length} live events...`, "supabase-debug");
      for (const event of liveEvents) {
        try {
          // Create a live stream for the event
          log(`Creating live stream for event ID ${event.id}...`, "supabase-debug");
          const { error: streamError } = await supabase
            .from("live_streams")
            .insert({
              event_id: event.id,
              stream_url: event.sport_id === soccerId
                ? "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                : "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              stream_type: "hls",
              quality: "720p",
              is_active: true,
              started_at: now.toISOString(),
              ended_at: null
            });
          
          if (logSupabaseError(streamError, `Error creating live stream for event ID ${event.id}`)) {
            log("Continuing despite live stream creation error...", "supabase");
            continue; // Skip to next event instead of failing completely
          }
          log(`Successfully created live stream for event ID ${event.id}`, "supabase-debug");
          
          // Create stats for the event
          let initialStats: StatsType = {};
          
          // Soccer stats
          if (event.sport_id === soccerId) {
            initialStats = {
              possession: { home: 54, away: 46 },
              shots: { home: 8, away: 6 },
              shotsOnTarget: { home: 3, away: 2 },
              corners: { home: 5, away: 3 },
              fouls: { home: 7, away: 9 },
              yellowCards: { home: 1, away: 2 }
            };
          }
          // Basketball stats
          else if (event.sport_id === basketballId) {
            initialStats = {
              rebounds: { home: 24, away: 22 },
              assists: { home: 15, away: 13 },
              steals: { home: 7, away: 5 },
              blocks: { home: 3, away: 4 },
              fouls: { home: 12, away: 15 }
            };
          }
          
          log(`Creating stats for event ID ${event.id}...`, "supabase-debug");
          const { error: statsError } = await supabase
            .from("live_stream_stats")
            .insert({
              event_id: event.id,
              stats: initialStats,
              last_updated: now.toISOString()
            });
          
          if (logSupabaseError(statsError, `Error creating stats for event ID ${event.id}`)) {
            log("Continuing despite stats creation error...", "supabase");
            continue; // Skip to next event instead of failing completely
          }
          
          log(`Successfully created stats for event ID ${event.id}`, "supabase-debug");
        } catch (error: any) {
          const errorMsg = error?.message || 'Unknown error occurred';
          log(`Error processing live event ${event.id}: ${errorMsg}`, "supabase-error");
          // Continue with next event instead of failing the entire process
          continue;
        }
      }
      
      // Create recommendations
      if (events.length >= 3) {
        log("Creating recommendations...", "supabase-debug");
        const recommendationsData = [
          {
            event_id: events[0].id,
            bet_type: "Match Result",
            selection: events[0].home_team,
            confidence: 0.82,
            reasoning: `Based on recent form, ${events[0].home_team} has won 4 out of their last 5 home games.`,
            is_trending: true,
            is_value_bet: true,
            created_at: now.toISOString()
          },
          {
            event_id: events[1].id,
            bet_type: "Match Result",
            selection: "Draw",
            confidence: 0.67,
            reasoning: "Both teams have drawn their last 2 matches against each other.",
            is_trending: true,
            is_value_bet: false,
            created_at: now.toISOString()
          },
          {
            event_id: events[2].id,
            bet_type: "Match Result",
            selection: events[2].away_team,
            confidence: 0.73,
            reasoning: `${events[2].away_team} has a strong record against ${events[2].home_team}.`,
            is_trending: false,
            is_value_bet: true,
            created_at: now.toISOString()
          }
        ];
        
        const { error: recError } = await supabase
          .from("recommendations")
          .insert(recommendationsData);
        
        if (logSupabaseError(recError, "Error creating recommendations")) {
          // Continue with the process - don't throw here
          log("Continuing despite recommendation creation error...", "supabase");
          // We'll just skip creating recommendations but continue with the rest of the setup
        }
        
        log("Successfully created recommendations", "supabase-debug");
      }
      
      log("Successfully seeded initial data", "supabase");
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error occurred';
      log(`Error seeding initial data: ${errorMsg}`, "supabase");
      throw error;
    }
  }
}

// Export an instance of SupabaseStorage
export const storage = new SupabaseStorage();