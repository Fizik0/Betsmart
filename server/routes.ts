import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertBetSchema, insertLiveStreamSchema } from "@shared/schema";
import { generateRecommendations, generateEventPrediction, generatePersonalizedRecommendations } from "./openai";
import { Sports, Countries, Leagues, SportsHierarchy } from "@shared/sports-hierarchy";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import WebSocket from "ws";
import { registerOddsApiRoutes } from "./odds-api-routes";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "sportsbook-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // User Routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // @ts-ignore
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", isAuthenticated, (req, res) => {
    // @ts-ignore
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Sports Routes
  app.get("/api/sports", async (req, res) => {
    try {
      console.log("GET /api/sports requested");
      
      // Если запрос на получение спортов с подробной иерархией
      if (req.query.detailed === 'true') {
        console.log("Returning detailed sports data");
        return res.json(Sports);
      }
      
      // Импортируем напрямую Sports из модуля
      try {
        console.log("Using Sports from sports-hierarchy");
        const sportsList = Sports.map(sport => ({
          id: sport.id,
          name: sport.name,
          icon: sport.icon,
          displayOrder: sport.displayOrder ?? 0,
          isPopular: sport.isPopular ?? false
        }));
        return res.json(sportsList);
      } catch (hierarchyError) {
        console.error("Error with sports-hierarchy:", hierarchyError);
      }
      
      // Пробуем получить данные из хранилища
      console.log("Trying to get sports from storage");
      const sports = await storage.getAllSports();
      console.log(`Got ${sports.length} sports from storage`);
      res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });
  
  // Иерархия: маршруты для спортивной иерархии
  app.get("/api/sports/hierarchy", async (req, res) => {
    try {
      const hierarchyData = Object.values(SportsHierarchy);
      res.json(hierarchyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports hierarchy" });
    }
  });
  
  // Получение иерархии для конкретного вида спорта
  app.get("/api/sports/:id/hierarchy", async (req, res) => {
    try {
      const sportId = Number(req.params.id);
      let sportData = null;
      
      // Находим спорт в нашей иерархии
      for (const [key, sport] of Object.entries(SportsHierarchy)) {
        if (sport.id === sportId) {
          sportData = sport;
          break;
        }
      }
      
      if (!sportData) {
        return res.status(404).json({ message: "Sport not found" });
      }
      
      res.json(sportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sport hierarchy" });
    }
  });
  
  // Маршрут для получения списка стран
  app.get("/api/countries", async (req, res) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      
      if (sportId) {
        // Фильтруем страны по спорту
        const countriesForSport = Countries.filter(country => {
          for (const sport of Object.values(SportsHierarchy)) {
            if (sport.id === sportId) {
              return sport.countries.some(c => c.id === country.id);
            }
          }
          return false;
        });
        return res.json(countriesForSport);
      }
      
      res.json(Countries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });
  
  // Маршрут для получения списка лиг/турниров
  app.get("/api/leagues", async (req, res) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const countryId = req.query.countryId ? Number(req.query.countryId) : undefined;
      const popular = req.query.popular === 'true';
      
      let filteredLeagues = [...Leagues];
      
      // Фильтруем по спорту, если указан
      if (sportId) {
        filteredLeagues = filteredLeagues.filter(league => league.sportId === sportId);
      }
      
      // Фильтруем по стране, если указана
      if (countryId) {
        filteredLeagues = filteredLeagues.filter(league => league.countryId === countryId);
      }
      
      // Фильтруем только популярные лиги, если указан флаг
      if (popular) {
        filteredLeagues = filteredLeagues.filter(league => league.isPopular);
      }
      
      // Сортируем по порядку отображения
      filteredLeagues.sort((a, b) => a.displayOrder - b.displayOrder);
      
      res.json(filteredLeagues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leagues" });
    }
  });
  
  // Маршрут для получения списка команд
  app.get("/api/teams", async (req, res) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const countryId = req.query.countryId ? Number(req.query.countryId) : undefined;
      const leagueId = req.query.leagueId ? Number(req.query.leagueId) : undefined;
      
      // Получаем список всех команд из нашей иерархии
      let allTeams: any[] = [];
      
      // Собираем команды из всех спортов
      for (const sport of Object.values(SportsHierarchy)) {
        if (sportId && sport.id !== sportId) continue;
        
        // Для каждой страны
        for (const country of sport.countries) {
          if (countryId && country.id !== countryId) continue;
          
          // Для каждой лиги
          for (const league of country.leagues) {
            if (leagueId && league.id !== leagueId) continue;
            
            // Создаем фиктивные команды по принципу из ранее созданных объектов
            // В реальном приложении здесь были бы реальные команды из базы данных
            const teamNames = [
              { name: `${league.name} Team 1`, shortName: "T1", id: league.id * 100 + 1 },
              { name: `${league.name} Team 2`, shortName: "T2", id: league.id * 100 + 2 },
              { name: `${league.name} Team 3`, shortName: "T3", id: league.id * 100 + 3 },
              { name: `${league.name} Team 4`, shortName: "T4", id: league.id * 100 + 4 }
            ];
            
            for (const team of teamNames) {
              allTeams.push({
                id: team.id,
                name: team.name,
                shortName: team.shortName,
                countryId: country.id,
                sportId: sport.id,
                leagueId: league.id,
                logo: `https://via.placeholder.com/150?text=${team.shortName}`
              });
            }
          }
        }
      }
      
      res.json(allTeams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Events Routes
  app.get("/api/events", async (req, res) => {
    try {
      const { sportId, isLive, leagueId, countryId, limit } = req.query;
      
      let events;
      try {
        if (sportId && isLive) {
          console.log(`Fetching events for sportId=${sportId} and isLive=${isLive}`);
          events = await storage.getEventsBySportAndLiveStatus(
            Number(sportId), 
            isLive === "true"
          );
        } else if (sportId) {
          console.log(`Fetching events for sportId=${sportId}`);
          events = await storage.getEventsBySport(Number(sportId));
        } else if (isLive === "true") {
          console.log(`Fetching live events`);
          
          // Используем адаптер db-utils для получения live событий
          const { getLiveEvents } = await import('./db-utils');
          events = await getLiveEvents();
        } else {
          console.log(`Fetching upcoming events with limit=${limit || 'default'}`);
          
          // Используем адаптер db-utils для получения предстоящих событий
          const { getUpcomingEventsWithLimit } = await import('./db-utils');
          events = await getUpcomingEventsWithLimit(limit ? Number(limit) : 10);
        }
      } catch (dbError) {
        console.error("Database error fetching events:", dbError);
        return res.status(500).json({ 
          message: "Failed to fetch events from database", 
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }
      
      // Если мы получили undefined или null вместо массива
      if (!events) {
        console.log("Warning: events is null/undefined, defaulting to empty array");
        events = [];
      }
      
      try {
        // Если передан leagueId, дополнительно фильтруем результаты
        if (leagueId && events.length > 0) {
          const { Leagues } = await import('../shared/sports-hierarchy');
          const selectedLeague = Leagues.find(l => l.id === Number(leagueId));
          if (selectedLeague) {
            events = events.filter(event => event.league === selectedLeague.name);
          }
        }
        
        // Если передан countryId, дополнительно фильтруем результаты
        if (countryId && events.length > 0) {
          const { Leagues } = await import('../shared/sports-hierarchy');
          const countryLeagues = Leagues.filter(l => l.countryId === Number(countryId)).map(l => l.name);
          events = events.filter(event => countryLeagues.includes(event.league));
        }
      } catch (filterError) {
        console.error("Error filtering events:", filterError);
        // Продолжаем выполнение, даже если фильтрация не удалась
        // в этом случае просто возвращаем все события без фильтрации
      }
      
      res.json(events);
    } catch (error) {
      console.error("Unexpected error in events route handler:", error);
      res.status(500).json({ 
        message: "Failed to fetch events",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Sport Events Route
  app.get("/api/sports/:sportId/events", async (req, res) => {
    try {
      const sportId = Number(req.params.sportId);
      
      if (isNaN(sportId)) {
        return res.status(400).json({ message: "Invalid sport ID" });
      }
      
      console.log(`Fetching events for sportId=${sportId}`);
      
      // Используем адаптер db-utils для получения событий
      const { getSportEvents } = await import('./db-utils');
      const events = await getSportEvents(sportId);
      
      res.json(events);
    } catch (error) {
      console.error("Error in sport events route handler:", error);
      res.status(500).json({ 
        message: "Failed to fetch events for sport",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Маршрут для получения предстоящих событий
  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      
      // Используем адаптер db-utils для получения предстоящих событий
      const { getUpcomingEventsWithLimit } = await import('./db-utils');
      const events = await getUpcomingEventsWithLimit(limit);
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      // Используем адаптер db-utils для получения события по ID
      const { getEventById } = await import('./db-utils');
      const event = await getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error(`Error fetching event with ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Bets Routes
  app.post("/api/bets", isAuthenticated, async (req, res) => {
    try {
      const betData = insertBetSchema.parse(req.body);
      // @ts-ignore
      const userId = req.user.id;
      
      // Calculate potential win
      const potentialWin = betData.stake * betData.odds;
      
      // Check if user has enough balance
      // @ts-ignore
      if (req.user.balance < betData.stake) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const bet = await storage.createBet({
        ...betData,
        userId,
        potentialWin,
      });
      
      // Update user balance
      // @ts-ignore
      await storage.updateUserBalance(userId, req.user.balance - betData.stake);
      
      res.status(201).json(bet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to place bet" });
    }
  });

  app.get("/api/bets", isAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const bets = await storage.getUserBets(userId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // AI Recommendations Routes
  app.get("/api/recommendations", async (req, res) => {
    try {
      const limitParam = req.query.limit;
      const limit = limitParam ? parseInt(limitParam as string) : 3;
      
      // Используем адаптер db-utils для получения последних рекомендаций
      const { getLatestRecommendations } = await import('./db-utils');
      const recommendations = await getLatestRecommendations(limit);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/generate", async (req, res) => {
    try {
      const recommendations = await generateRecommendations();
      
      if (!recommendations || recommendations.length === 0) {
        return res.status(500).json({ 
          message: "Не удалось сгенерировать рекомендации", 
          error: "ai_unavailable"
        });
      }
      
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      let statusCode = 500;
      let errorType = "server_error";
      
      if (error?.status === 429) {
        statusCode = 429;
        errorType = "rate_limit_exceeded";
      }
      
      res.status(statusCode).json({ 
        message: "Не удалось сгенерировать рекомендации", 
        error: errorType
      });
    }
  });
  
  // ИИ прогнозы для конкретного события
  app.get("/api/events/:id/prediction", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      // Проверяем существует ли событие, используя адаптер db-utils
      const { getEventById } = await import('./db-utils');
      const event = await getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ 
          message: "Событие не найдено", 
          error: "event_not_found" 
        });
      }
      
      const prediction = await generateEventPrediction(eventId);
      
      if (!prediction) {
        return res.status(503).json({ 
          message: "Не удалось создать прогноз для данного события", 
          error: "ai_unavailable"
        });
      }
      
      res.json(prediction);
    } catch (error: any) {
      console.error(`Error generating prediction for event ${req.params.id}:`, error);
      
      let statusCode = 500;
      let errorType = "server_error";
      
      if (error?.status === 429) {
        statusCode = 429;
        errorType = "rate_limit_exceeded";
      }
      
      res.status(statusCode).json({ 
        message: "Ошибка генерации прогноза", 
        error: errorType
      });
    }
  });
  
  // Персонализированные рекомендации для пользователя
  app.get("/api/recommendations/personalized", isAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const personalizedRecommendations = await generatePersonalizedRecommendations(userId);
      
      if (!personalizedRecommendations || personalizedRecommendations.length === 0) {
        return res.status(503).json({ 
          message: "Не удалось сгенерировать персонализированные рекомендации", 
          error: "ai_unavailable"
        });
      }
      
      res.json(personalizedRecommendations);
    } catch (error: any) {
      // @ts-ignore - мы знаем, что user существует из-за middleware isAuthenticated
      console.error(`Error generating personalized recommendations for user ${req.user?.id}:`, error);
      
      let statusCode = 500;
      let errorType = "server_error";
      
      if (error?.status === 429) {
        statusCode = 429;
        errorType = "rate_limit_exceeded";
      }
      
      res.status(statusCode).json({ 
        message: "Не удалось сгенерировать персонализированные рекомендации", 
        error: errorType
      });
    }
  });
  
  // Рекомендации для конкретного события
  app.get("/api/events/:id/recommendations", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      
      // Используем адаптер db-utils для получения рекомендаций для события
      const { getRecommendationsForEvent } = await import('./db-utils');
      const recommendations = await getRecommendationsForEvent(eventId);
      
      res.json(recommendations);
    } catch (error) {
      console.error(`Error fetching recommendations for event ${req.params.id}:`, error);
      res.status(500).json({ message: "Не удалось получить рекомендации для этого события" });
    }
  });


  // Initialize Data Routes (for demo purposes)
  app.post("/api/seed", async (req, res) => {
    try {
      await storage.seedInitialData();
      res.json({ message: "Initial data seeded successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed initial data" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for live stream
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket & { eventId?: number }) => {
    console.log('Client connected to WebSocket');
    
    // Handle incoming messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Client is subscribing to a specific event's live stream
          ws.eventId = data.eventId;
          console.log(`Client subscribed to event ${data.eventId}`);
          
          // Send current stream data to the newly connected client
          try {
            const stream = await storage.getLiveStreamByEvent(data.eventId);
            const stats = await storage.getLiveStreamStats(data.eventId);
            
            if (stream) {
              ws.send(JSON.stringify({
                type: 'stream_info',
                stream
              }));
            }
            
            if (stats) {
              ws.send(JSON.stringify({
                type: 'stats',
                stats
              }));
            }
          } catch (error) {
            console.error('Error fetching initial stream data:', error);
          }
        } else if (data.type === 'stream_update' && data.stream) {
          // Update stream info (admin only in a real application)
          try {
            const streamData = insertLiveStreamSchema.parse(data.stream);
            let stream;
            
            if (data.stream.id) {
              // Update existing stream
              stream = await storage.updateLiveStream(data.stream.id, data.stream);
            } else {
              // Create new stream
              stream = await storage.createLiveStream(streamData);
            }
            
            // Broadcast the updated stream to all clients subscribed to this event
            broadcastToEvent(stream.eventId, {
              type: 'stream_info',
              stream
            });
          } catch (error) {
            console.error('Invalid stream data:', error);
          }
        } else if (data.type === 'stats' && data.stats) {
          // Update stats for an event
          try {
            const eventId = Number(data.eventId);
            const stats = data.stats;
            
            // Update stats in storage
            const updatedStats = await storage.createOrUpdateLiveStreamStats(eventId, stats);
            
            // Broadcast updated stats to all clients subscribed to this event
            broadcastToEvent(eventId, {
              type: 'stats',
              stats: updatedStats
            });
          } catch (error) {
            console.error('Error updating stats:', error);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  // Helper function to broadcast messages to clients subscribed to a specific event
  function broadcastToEvent(eventId: number, message: any) {
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN && client.eventId === eventId) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  // Live Stream API Routes
  app.get("/api/events/:id/stream", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const stream = await storage.getLiveStreamByEvent(eventId);
      
      if (!stream) {
        return res.status(404).json({ message: "No active stream found for this event" });
      }
      
      res.json(stream);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live stream" });
    }
  });
  
  // Get all streams
  app.get("/api/streams", async (req, res) => {
    try {
      const streams = await storage.getLiveStreams();
      res.json(streams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });
  
  // Create a new stream
  app.post("/api/streams", async (req, res) => {
    try {
      const streamData = insertLiveStreamSchema.parse(req.body);
      const stream = await storage.createLiveStream(streamData);
      
      // Update event to set hasLiveStream to true
      const { getEventById } = await import('./db-utils');
      const event = await getEventById(streamData.eventId);
      
      if (event && !event.hasLiveStream) {
        // Используем старый метод для обновления, так как это редкий случай
        await storage.updateEvent(streamData.eventId, { hasLiveStream: true });
      }
      
      res.status(201).json(stream);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create live stream" });
    }
  });
  
  // Update a stream
  app.patch("/api/streams/:id", async (req, res) => {
    try {
      const streamId = Number(req.params.id);
      const updates = req.body;
      const updatedStream = await storage.updateLiveStream(streamId, updates);
      res.json(updatedStream);
    } catch (error) {
      res.status(500).json({ message: "Failed to update live stream" });
    }
  });
  
  // Live Stream Stats API Routes
  app.get("/api/events/:id/stats", async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const stats = await storage.getLiveStreamStats(eventId);
      
      if (!stats) {
        return res.status(404).json({ message: "Stats not found for this event" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live stream stats" });
    }
  });

  // Регистрируем маршруты для The Odds API
  registerOddsApiRoutes(app);

  return httpServer;
}
