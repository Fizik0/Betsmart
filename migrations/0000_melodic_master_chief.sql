CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"bet_type" text NOT NULL,
	"selection" text NOT NULL,
	"odds" real NOT NULL,
	"stake" real NOT NULL,
	"potential_win" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport_id" integer NOT NULL,
	"league" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"live_minute" integer,
	"home_score" integer,
	"away_score" integer,
	"odds" jsonb NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"popular" boolean DEFAULT false NOT NULL,
	"has_live_stream" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_stream_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"stats" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"stream_url" text NOT NULL,
	"title" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"stream_type" text DEFAULT 'hls' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"quality" text DEFAULT '720p' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"bet_type" text NOT NULL,
	"selection" text NOT NULL,
	"confidence" real NOT NULL,
	"reasoning" text,
	"is_trending" boolean DEFAULT false NOT NULL,
	"is_value_bet" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"balance" real DEFAULT 0 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
