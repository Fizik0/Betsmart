/**
 * Интеграция с The Odds API для получения данных о спортивных событиях и коэффициентах
 * API Docs: https://the-odds-api.com/liveapi/guides/v4/
 */

import { Sport, InsertEvent, Event } from '@shared/schema';
import { log } from './vite';
import { sportIdMapping } from './db-utils';

// API ключ из переменных окружения
const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4';

// Маппинг спортов The Odds API в наши идентификаторы спортов
// https://the-odds-api.com/sports-odds-data/sports-apis.html
const SPORT_KEY_MAPPING: Record<string, number> = {
  'soccer_epl': 1,             // Премьер-лига Англии
  'soccer_spain_la_liga': 1,   // Ла Лига
  'soccer_germany_bundesliga': 1, // Бундеслига
  'soccer_italy_serie_a': 1,   // Серия А
  'soccer_france_ligue_one': 1, // Лига 1
  'soccer_uefa_champs_league': 1, // Лига Чемпионов
  'soccer_uefa_europa_league': 1, // Лига Европы

  'basketball_nba': 2,         // НБА
  'basketball_euroleague': 2,  // Евролига
  'basketball_ncaab': 2,       // NCAA

  'icehockey_nhl': 3,          // НХЛ
  'icehockey_sweden_hockey_league': 3, // Шведская хоккейная лига
  'icehockey_khl': 3,          // КХЛ

  'tennis_atp_french_open': 4, // ATP French Open
  'tennis_wta_french_open': 4, // WTA French Open
  'tennis_atp_us_open': 4,     // ATP US Open
  'tennis_wta_us_open': 4,     // WTA US Open
  
  'baseball_mlb': 5,           // MLB
  'baseball_ncaa': 5,          // NCAA Бейсбол
};

// Маппинг рынков ставок
const MARKET_KEY_MAPPING: Record<string, string> = {
  'h2h': 'outcome', // Исход матча
  'spreads': 'handicap', // Форы
  'totals': 'totals', // Тоталы
};

/**
 * Получает список доступных спортов из The Odds API
 */
export async function fetchSports(): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/sports?apiKey=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log(`[odds-api] Fetched ${data.length} sports`, 'odds-api');
    
    return data;
  } catch (error) {
    log(`[odds-api] Error fetching sports: ${error}`, 'odds-api-error');
    throw error;
  }
}

/**
 * Получает список предстоящих событий для конкретного спорта
 * @param sportKey Ключ спорта из The Odds API
 * @param regions Регионы для коэффициентов (us, uk, eu, au)
 * @param markets Типы рынков ставок (h2h, spreads, totals)
 */
export async function fetchOddsForSport(
  sportKey: string, 
  regions: string = 'eu', 
  markets: string = 'h2h'
): Promise<any[]> {
  try {
    const url = `${BASE_URL}/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log(`[odds-api] Fetched ${data.length} events for ${sportKey}`, 'odds-api');
    
    return data;
  } catch (error) {
    log(`[odds-api] Error fetching odds for ${sportKey}: ${error}`, 'odds-api-error');
    throw error;
  }
}

/**
 * Получает список всех предстоящих событий для всех поддерживаемых спортов
 */
export async function fetchAllUpcomingEvents(): Promise<InsertEvent[]> {
  try {
    // Получаем список всех спортов
    const sports = await fetchSports();
    const supportedSports = sports.filter(sport => 
      Object.keys(SPORT_KEY_MAPPING).includes(sport.key) && sport.active
    );
    
    if (supportedSports.length === 0) {
      log('[odds-api] No supported active sports available', 'odds-api');
      return [];
    }
    
    // Для каждого поддерживаемого спорта получаем события
    const allEvents: InsertEvent[] = [];
    
    for (const sport of supportedSports) {
      try {
        // Лимитируем запросы, чтобы не превысить бесплатный лимит
        const events = await fetchOddsForSport(sport.key);
        
        // Преобразуем события из формата API в наш формат
        const convertedEvents = events.map(event => convertToEventFormat(event, sport));
        allEvents.push(...convertedEvents);
        
        // Добавляем задержку между запросами, чтобы не превысить ограничения API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        log(`[odds-api] Error fetching events for ${sport.key}: ${error}`, 'odds-api-error');
        // Продолжаем с другими спортами, даже если один вызовет ошибку
        continue;
      }
    }
    
    log(`[odds-api] Total upcoming events fetched: ${allEvents.length}`, 'odds-api');
    return allEvents;
  } catch (error) {
    log(`[odds-api] Error fetching all upcoming events: ${error}`, 'odds-api-error');
    throw error;
  }
}

/**
 * Преобразует событие из формата The Odds API в наш формат InsertEvent
 */
function convertToEventFormat(event: any, sport: any): InsertEvent {
  try {
    // Получаем маппинги ID спорта
    const sportId = SPORT_KEY_MAPPING[sport.key] || 1; // По умолчанию футбол
    
    // Определяем команды
    const [homeTeam, awayTeam] = event.home_team && event.away_team 
      ? [event.home_team, event.away_team]
      : event.name.split(' vs ');
    
    // Парсим время начала (формат ISO)
    const startTimeDate = new Date(event.commence_time);
    
    // Преобразуем коэффициенты
    const odds: Record<string, number> = {};
    
    // Перебираем все доступные букмекеров и берем средние коэффициенты
    if (event.bookmakers && event.bookmakers.length > 0) {
      // Собираем все коэффициенты от разных букмекеров
      const allOutcomes: Record<string, number[]> = {};
      
      for (const bookmaker of event.bookmakers) {
        for (const market of bookmaker.markets) {
          for (const outcome of market.outcomes) {
            // Нормализуем имя исхода для соответствия нашей схеме
            let outcomeKey = '';
            
            if (outcome.name === homeTeam) {
              outcomeKey = 'homeWin';
            } else if (outcome.name === awayTeam) {
              outcomeKey = 'awayWin';
            } else if (outcome.name === 'Draw') {
              outcomeKey = 'draw';
            } else {
              // Если другие типы исходов - используем имя из API
              outcomeKey = outcome.name.toLowerCase().replace(/\s+/g, '_');
            }
            
            if (!allOutcomes[outcomeKey]) {
              allOutcomes[outcomeKey] = [];
            }
            
            allOutcomes[outcomeKey].push(outcome.price);
          }
        }
      }
      
      // Вычисляем средние коэффициенты для каждого исхода
      for (const [key, values] of Object.entries(allOutcomes)) {
        odds[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    }
    
    // Определяем лигу из группы
    const league = sport.group || sport.description || 'Unknown League';
    
    // В реальном мире нужно было бы маппить лиги в наши ID,
    // но для примера используем спортивное наименование
    const leagueId = 1; // Заглушка
    const homeTeamId = 1; // Заглушка
    const awayTeamId = 2; // Заглушка
    
    return {
      sportId,
      league,
      leagueId,
      homeTeam,
      awayTeam,
      homeTeamId,
      awayTeamId,
      startTime: startTimeDate.toISOString(),
      odds,
      status: 'upcoming',
      popular: sport.group ? true : false, // Популярные - события в основных группах
      isLive: false,
      liveMinute: null,
      homeScore: null,
      awayScore: null,
      hasLiveStream: false,
    };
  } catch (error) {
    log(`[odds-api] Error converting event: ${error}`, 'odds-api-error');
    throw error;
  }
}

/**
 * Получает ограничения запросов к API
 */
export async function fetchApiUsage(): Promise<{
  used: number;
  remaining: number;
  resets_at?: string;
}> {
  try {
    // Выполним запрос к любому endpoint, чтобы получить заголовки с информацией о лимитах
    const response = await fetch(`${BASE_URL}/sports?apiKey=${API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    // Извлекаем информацию о лимитах из заголовков
    const used = parseInt(response.headers.get('x-requests-used') || '0');
    const remaining = parseInt(response.headers.get('x-requests-remaining') || '0');
    const resetsAt = response.headers.get('x-requests-reset') || undefined;
    
    return {
      used,
      remaining,
      resets_at: resetsAt
    };
  } catch (error) {
    log(`[odds-api] Error fetching API usage: ${error}`, 'odds-api-error');
    throw error;
  }
}

/**
 * Получает информацию о конкретном событии по его внешнему ID
 */
export async function fetchEventById(sportKey: string, eventId: string): Promise<any> {
  try {
    const url = `${BASE_URL}/sports/${sportKey}/events/${eventId}/odds?apiKey=${API_KEY}&regions=eu&markets=h2h,spreads,totals&oddsFormat=decimal`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log(`[odds-api] Fetched event ${eventId}`, 'odds-api');
    
    return data;
  } catch (error) {
    log(`[odds-api] Error fetching event ${eventId}: ${error}`, 'odds-api-error');
    throw error;
  }
}

/**
 * Проверяет статус API
 */
export async function checkApiStatus(): Promise<{
  status: 'ok' | 'error';
  message: string;
  usage?: {
    used: number;
    remaining: number;
    resets_at?: string;
  };
}> {
  try {
    const usage = await fetchApiUsage();
    
    return {
      status: 'ok',
      message: `API is working. ${usage.remaining} requests remaining.`,
      usage
    };
  } catch (error) {
    return {
      status: 'error',
      message: `API error: ${error}`
    };
  }
}