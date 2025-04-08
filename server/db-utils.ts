import { db } from './db';
import { sql } from 'drizzle-orm';
import { log } from './vite';
import { Event, InsertEvent, InsertRecommendation, Recommendation } from '@shared/schema';

/**
 * Спортивные ID в БД не совпадают с ID в нашем API
 * Эта таблица соответствия помогает преобразовать ID
 */
export const sportIdMapping: Record<number, number> = {
  // API ID (Sports) => DB ID
  1: 15, // Футбол => Soccer
  2: 16, // Баскетбол => Basketball
  3: 17, // Теннис => Tennis
  4: 18, // Хоккей => Hockey
  5: 21, // Бокс => MMA (используем MMA для бокса, так как отдельной категории нет)
  6: 21, // MMA => MMA
  7: 20, // Американский футбол => American Football
  8: 19, // Бейсбол => Baseball
  
  // DB ID => API ID (Sports)
  15: 1, // Soccer => Футбол
  16: 2, // Basketball => Баскетбол
  17: 3, // Tennis => Теннис
  18: 4, // Hockey => Хоккей
  19: 8, // Baseball => Бейсбол
  20: 7, // American Football => Американский футбол
  21: 6, // MMA => MMA
  22: 0, // Esports - нет соответствия в нашем API
};

/**
 * Получает список спортивных событий для указанного вида спорта
 */
export async function getSportEvents(sportId: number): Promise<any[]> {
  // Преобразовываем API ID спорта в DB ID
  const dbSportId = sportIdMapping[sportId] || sportId;
  
  try {
    // Запрос к базе данных за событиями с указанным sportId
    const result = await db.execute(sql`
      SELECT * FROM events 
      WHERE sport_id = ${dbSportId}
      ORDER BY start_time DESC
    `);
    
    log(`Found ${result.length} events for sportId=${sportId} (db id: ${dbSportId})`, 'db');
    
    // Преобразуем результаты в формат, совместимый с нашим API
    return result.map(convertDBEventToAPI);
  } catch (error) {
    log(`Error getting events for sportId=${sportId}: ${error}`, 'db');
    return [];
  }
}

/**
 * Получает список событий по спорту с фильтром по статусу isLive
 */
export async function getLiveEventsForSport(
  sportId: number, 
  isLive: boolean
): Promise<any[]> {
  // Преобразовываем API ID спорта в DB ID
  const dbSportId = sportIdMapping[sportId] || sportId;
  
  try {
    // Запрос к базе данных с фильтрацией по isLive
    const result = await db.execute(sql`
      SELECT * FROM events 
      WHERE sport_id = ${dbSportId}
      AND is_live = ${isLive}
      ORDER BY start_time DESC
    `);
    
    log(`Found ${result.length} events for sportId=${sportId} with isLive=${isLive}`, 'db');
    
    // Преобразуем результаты
    return result.map(convertDBEventToAPI);
  } catch (error) {
    log(`Error getting events for sportId=${sportId} with isLive=${isLive}: ${error}`, 'db');
    return [];
  }
}

/**
 * Получает список предстоящих событий с ограничением по количеству
 */
export async function getUpcomingEventsWithLimit(limit: number = 10): Promise<any[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM events 
      WHERE is_live = false
      ORDER BY start_time ASC
      LIMIT ${limit}
    `);
    
    return result.map(convertDBEventToAPI);
  } catch (error) {
    log(`Error getting upcoming events: ${error}`, 'db');
    return [];
  }
}

/**
 * Получает список всех текущих live событий
 */
export async function getLiveEvents(): Promise<any[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM events 
      WHERE is_live = true
      ORDER BY start_time DESC
    `);
    
    return result.map(convertDBEventToAPI);
  } catch (error) {
    log(`Error getting live events: ${error}`, 'db');
    return [];
  }
}

/**
 * Получает событие по его ID
 */
export async function getEventById(id: number): Promise<any | undefined> {
  try {
    const [result] = await db.execute(sql`
      SELECT * FROM events 
      WHERE id = ${id}
    `);
    
    if (!result) return undefined;
    
    return convertDBEventToAPI(result);
  } catch (error) {
    log(`Error getting event by id ${id}: ${error}`, 'db');
    return undefined;
  }
}

/**
 * Создает новое спортивное событие
 */
export async function createEvent(event: InsertEvent): Promise<any> {
  try {
    // Преобразуем API ID спорта в DB ID если нужно
    const dbSportId = sportIdMapping[event.sportId] || event.sportId;
    
    // Преобразовываем startTime в строку, если это объект Date
    const startTimeStr = typeof event.startTime === 'string' 
      ? event.startTime 
      : event.startTime instanceof Date 
        ? event.startTime.toISOString() 
        : event.startTime;
        
    const oddsJSON = typeof event.odds === 'string' 
      ? event.odds 
      : JSON.stringify(event.odds);
        
    const [result] = await db.execute(sql`
      INSERT INTO events (
        sport_id, status, league, home_team, away_team, 
        start_time, is_live, live_minute, home_score, away_score, 
        odds, popular, has_live_stream
      ) VALUES (
        ${dbSportId}, ${event.status || 'upcoming'}, ${event.league}, 
        ${event.homeTeam}, ${event.awayTeam}, ${startTimeStr}, 
        ${event.isLive || false}, ${event.liveMinute || 0}, 
        ${event.homeScore || 0}, ${event.awayScore || 0}, 
        ${oddsJSON}, ${event.popular || false}, 
        ${event.hasLiveStream || false}
      )
      RETURNING *
    `);
    
    return convertDBEventToAPI(result);
  } catch (error) {
    log(`Error creating event: ${error}`, 'db');
    throw error;
  }
}

/**
 * Обновляет существующее спортивное событие
 */
export async function updateEvent(id: number, updates: any): Promise<any> {
  try {
    // Преобразуем API ID спорта в DB ID если он указан в обновлениях
    const dbUpdates = { ...updates };
    if (dbUpdates.sportId) {
      dbUpdates.sport_id = sportIdMapping[dbUpdates.sportId] || dbUpdates.sportId;
      delete dbUpdates.sportId;
    }
    
    // Преобразуем Date объекты в строки ISO
    if (dbUpdates.startTime instanceof Date) {
      dbUpdates.startTime = dbUpdates.startTime.toISOString();
    }
    
    // Формируем части SQL запроса динамически на основе переданных полей
    const updateFields = Object.entries(dbUpdates)
      .map(([key, value]) => {
        // Преобразуем camelCase в snake_case
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        
        if (value === null) {
          return `${snakeKey} = NULL`;
        } else if (typeof value === 'object') {
          return `${snakeKey} = '${JSON.stringify(value)}'`;
        } else if (typeof value === 'string') {
          return `${snakeKey} = '${value}'`;
        } else {
          return `${snakeKey} = ${value}`;
        }
      })
      .join(', ');
    
    const [result] = await db.execute(sql`
      UPDATE events
      SET ${sql.raw(updateFields)}
      WHERE id = ${id}
      RETURNING *
    `);
    
    return convertDBEventToAPI(result);
  } catch (error) {
    log(`Error updating event ${id}: ${error}`, 'db');
    throw error;
  }
}

/**
 * Преобразует объект события из БД в формат API
 */
function convertDBEventToAPI(dbEvent: any): Event {
  // Преобразование имен полей из snake_case в camelCase
  // И преобразование sportId из БД в API ID
  return {
    id: Number(dbEvent.id),
    sportId: Number(sportIdMapping[Number(dbEvent.sport_id)] || dbEvent.sport_id),
    createdAt: new Date(dbEvent.created_at),
    status: String(dbEvent.status || ''),
    league: dbEvent.league || null,
    leagueId: Number(dbEvent.league_id || 0),
    homeTeam: dbEvent.home_team || null,
    homeTeamId: Number(dbEvent.home_team_id || 0),
    awayTeam: dbEvent.away_team || null,
    awayTeamId: Number(dbEvent.away_team_id || 0),
    startTime: new Date(dbEvent.start_time),
    isLive: Boolean(dbEvent.is_live),
    liveMinute: dbEvent.live_minute !== undefined ? Number(dbEvent.live_minute) : null,
    homeScore: dbEvent.home_score !== undefined ? Number(dbEvent.home_score) : null,
    awayScore: dbEvent.away_score !== undefined ? Number(dbEvent.away_score) : null,
    homeScoreHT: dbEvent.home_score_ht !== undefined ? Number(dbEvent.home_score_ht) : null,
    awayScoreHT: dbEvent.away_score_ht !== undefined ? Number(dbEvent.away_score_ht) : null,
    odds: dbEvent.odds || {},
    popular: Boolean(dbEvent.popular),
    hasLiveStream: Boolean(dbEvent.has_live_stream),
    oddsHistory: dbEvent.odds_history || [],
    venue: dbEvent.venue || null,
    referee: dbEvent.referee || null,
    round: dbEvent.round || null
  };
}

/**
 * Создает новую рекомендацию
 */
export async function createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
  try {
    const [result] = await db.execute(sql`
      INSERT INTO recommendations (
        event_id, bet_type, selection, confidence, 
        reasoning, is_trending, is_value_bet
      ) VALUES (
        ${recommendation.eventId}, ${recommendation.betType}, 
        ${recommendation.selection}, ${recommendation.confidence}, 
        ${recommendation.reasoning}, ${recommendation.isTrending || false}, 
        ${recommendation.isValueBet || false}
      )
      RETURNING *
    `);
    
    return {
      id: Number(result.id),
      eventId: Number(result.event_id),
      betType: String(result.bet_type),
      selection: String(result.selection || ''),
      confidence: Number(result.confidence),
      reasoning: result.reasoning ? String(result.reasoning) : null,
      isTrending: Boolean(result.is_trending),
      isValueBet: Boolean(result.is_value_bet),
      createdAt: new Date(result.created_at)
    };
  } catch (error) {
    log(`Error creating recommendation: ${error}`, 'db');
    throw error;
  }
}

/**
 * Получает все рекомендации для конкретного события
 */
export async function getRecommendationsForEvent(eventId: number): Promise<Recommendation[]> {
  try {
    const results = await db.execute(sql`
      SELECT * FROM recommendations 
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `);
    
    return results.map(result => ({
      id: Number(result.id),
      eventId: Number(result.event_id),
      betType: String(result.bet_type),
      selection: String(result.selection || ''),
      confidence: Number(result.confidence),
      reasoning: result.reasoning ? String(result.reasoning) : null,
      isTrending: Boolean(result.is_trending),
      isValueBet: Boolean(result.is_value_bet),
      createdAt: new Date(result.created_at)
    }));
  } catch (error) {
    log(`Error getting recommendations for event ${eventId}: ${error}`, 'db');
    return [];
  }
}

/**
 * Получает последние рекомендации с ограничением по количеству
 */
export async function getLatestRecommendations(limit: number = 5): Promise<Recommendation[]> {
  try {
    const results = await db.execute(sql`
      SELECT * FROM recommendations 
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);
    
    return results.map(result => ({
      id: Number(result.id),
      eventId: Number(result.event_id),
      betType: String(result.bet_type),
      selection: String(result.selection || ''),
      confidence: Number(result.confidence),
      reasoning: result.reasoning ? String(result.reasoning) : null,
      isTrending: Boolean(result.is_trending),
      isValueBet: Boolean(result.is_value_bet),
      createdAt: new Date(result.created_at)
    }));
  } catch (error) {
    log(`Error getting latest recommendations: ${error}`, 'db');
    return [];
  }
}