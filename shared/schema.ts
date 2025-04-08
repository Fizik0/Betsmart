import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  balance: real("balance").notNull().default(0),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  balance: true,
});

// Countries table
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(), // ISO country code (e.g., "GB", "ES", "DE")
  flag: text("flag"), // URL to the country flag image
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
});

// Sports table
export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  displayOrder: integer("display_order").default(0), // Order for display in UI
  isPopular: boolean("is_popular").default(false), // If sport should be featured in popular section
});

export const insertSportSchema = createInsertSchema(sports).omit({
  id: true,
});

// Leagues/Tournaments table
export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sportId: integer("sport_id").notNull(),
  countryId: integer("country_id").notNull(),
  logo: text("logo"), // URL to the league logo
  type: text("type").default("league"), // "league", "cup", "tournament", etc.
  tier: integer("tier").default(1), // 1 = top tier, 2 = second tier, etc.
  isPopular: boolean("is_popular").default(false),
  displayOrder: integer("display_order").default(0),
  seasonYear: text("season_year"), // E.g., "2024-2025"
});

export const insertLeagueSchema = createInsertSchema(leagues).omit({
  id: true,
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"), // Abbreviated name for display
  logo: text("logo"), // URL to the team logo
  countryId: integer("country_id").notNull(),
  leagueId: integer("league_id"), // Can be null for national teams
  yearFounded: integer("year_founded"),
  stadiumName: text("stadium_name"),
  stadiumCapacity: integer("stadium_capacity"),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  sportId: integer("sport_id").notNull(),
  leagueId: integer("league_id").notNull(),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  // For backward compatibility until fully migrated
  league: text("league"),
  homeTeam: text("home_team"),
  awayTeam: text("away_team"),
  // Core event data
  startTime: timestamp("start_time").notNull(),
  isLive: boolean("is_live").notNull().default(false),
  liveMinute: integer("live_minute"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  // Optional half-time score
  homeScoreHT: integer("home_score_ht"),
  awayScoreHT: integer("away_score_ht"),
  // Additional information
  venue: text("venue"), // Stadium name
  referee: text("referee"), // Match referee
  round: text("round"), // Round/stage in tournament (e.g., "Group A", "Round of 16")
  // Betting related
  odds: jsonb("odds").notNull(), // Current odds
  oddsHistory: jsonb("odds_history").$type<Array<{ timestamp: string, odds: OddsType }>>(), // Historical odds changes
  // Status information
  status: text("status").notNull().default("upcoming"), // upcoming, live, finished, postponed, canceled
  popular: boolean("popular").notNull().default(false),
  hasLiveStream: boolean("has_live_stream").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

// Bets table
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  betType: text("bet_type").notNull(),
  selection: text("selection").notNull(),
  odds: real("odds").notNull(),
  stake: real("stake").notNull(),
  potentialWin: real("potential_win").notNull(),
  status: text("status").notNull().default("pending"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true,
  settledAt: true,
});

// AI recommendations table
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  betType: text("bet_type").notNull(),
  selection: text("selection").notNull(),
  confidence: real("confidence").notNull(),
  reasoning: text("reasoning"),
  isTrending: boolean("is_trending").notNull().default(false),
  isValueBet: boolean("is_value_bet").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

// LiveStream table (for video streaming)
export const liveStreams = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  streamUrl: text("stream_url").notNull(), // URL to the video stream (legacy)
  hlsUrl: text("hls_url"), // URL for HLS stream
  fallbackUrl: text("fallback_url"), // Fallback URL (e.g., mp4)
  title: text("title"),
  status: text("status").notNull().default("pending"),
  streamType: text("stream_type").notNull().default("hls"), // hls, webrtc, etc.
  isActive: boolean("is_active").notNull().default(true),
  quality: text("quality").notNull().default("720p"), // 720p, 1080p, etc.
  availableQualities: jsonb("available_qualities").$type<string[]>(), // Available qualities
  posterUrl: text("poster_url"), // Poster/thumbnail URL
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

// LiveStream stats table (preserved for match statistics)
export const liveStreamStats = pgTable("live_stream_stats", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  stats: jsonb("stats").notNull(), // Legacy format
  eventStats: jsonb("event_stats").$type<StatsType>(), // Structured stats
  highlights: jsonb("highlights").$type<Array<{
    time: number;
    title: string;
    description?: string;
  }>>(), // Key moments/highlights
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertLiveStreamStatsSchema = createInsertSchema(liveStreamStats).omit({
  id: true,
  lastUpdated: true,
});

// Define relation for countries table
export const countryRelations = relations(countries, ({ many }) => ({
  teams: many(teams),
  leagues: many(leagues)
}));

// Define relation for sports table
export const sportRelations = relations(sports, ({ many }) => ({
  leagues: many(leagues),
  events: many(events)
}));

// Define relation for leagues table
export const leagueRelations = relations(leagues, ({ one, many }) => ({
  sport: one(sports, {
    fields: [leagues.sportId],
    references: [sports.id]
  }),
  country: one(countries, {
    fields: [leagues.countryId],
    references: [countries.id]
  }),
  teams: many(teams),
  events: many(events)
}));

// Define relation for teams table
export const teamRelations = relations(teams, ({ one, many }) => ({
  country: one(countries, {
    fields: [teams.countryId],
    references: [countries.id]
  }),
  league: one(leagues, {
    fields: [teams.leagueId],
    references: [leagues.id],
    nullable: true
  }),
  homeEvents: many(events, { relationName: "homeTeam" }),
  awayEvents: many(events, { relationName: "awayTeam" })
}));

// Define relation for events table
export const eventRelations = relations(events, ({ one, many }) => ({
  sport: one(sports, {
    fields: [events.sportId],
    references: [sports.id]
  }),
  league: one(leagues, {
    fields: [events.leagueId],
    references: [leagues.id]
  }),
  homeTeam: one(teams, {
    fields: [events.homeTeamId],
    references: [teams.id],
    relationName: "homeTeam"
  }),
  awayTeam: one(teams, {
    fields: [events.awayTeamId],
    references: [teams.id],
    relationName: "awayTeam"
  }),
  bets: many(bets),
  liveStream: one(liveStreams, {
    fields: [events.id],
    references: [liveStreams.eventId]
  }),
  recommendations: many(recommendations)
}));

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

export type InsertSport = z.infer<typeof insertSportSchema>;
export type Sport = typeof sports.$inferSelect;

export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leagues.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;

export type InsertLiveStreamStats = z.infer<typeof insertLiveStreamStatsSchema>;
export type LiveStreamStats = typeof liveStreamStats.$inferSelect;

// Define custom types for frontend use
export type OddsType = {
  homeWin?: number;
  awayWin?: number;
  draw?: number;
  over?: number;
  under?: number;
  [key: string]: number | undefined;
};

export type StatsType = {
  possession?: { home: number, away: number },
  shots?: { home: number, away: number },
  shotsOnTarget?: { home: number, away: number },
  corners?: { home: number, away: number },
  fouls?: { home: number, away: number },
  yellowCards?: { home: number, away: number },
  redCards?: { home: number, away: number },
  [key: string]: { home: number, away: number } | undefined;
};
