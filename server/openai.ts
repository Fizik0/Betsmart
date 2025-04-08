import OpenAI from "openai";
import { storage } from "./storage";
import { InsertRecommendation, Event, Sport } from "@shared/schema";

// Используем GPT-4.5 Turbo (gpt-4o) как явно запрошено пользователем
// В APIв OpenAI возможно использование "gpt-4o-2024-08-01" или просто "gpt-4o"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "demo-key" });

// Интерфейс для прогнозов по событию
export interface EventPrediction {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScore: { home: number, away: number };
  keyFactors: string[];
  bestBets: {
    type: string;
    selection: string;
    odds: number;
    valueRating: number;
    confidence: number;
    explanation: string;
  }[];
  analysis: string;
}

/**
 * Генерирует рекомендации для ставок на предстоящие события
 */
export async function generateRecommendations(): Promise<InsertRecommendation[]> {
  try {
    // Получаем предстоящие события
    const events = await storage.getUpcomingEvents(10);
    
    if (events.length === 0) {
      return [];
    }
    
    // Получаем спорты для контекста
    const sports = await storage.getAllSports();
    const sportsMap = new Map<number, Sport>();
    sports.forEach(sport => sportsMap.set(sport.id, sport));
    
    // Подготавливаем данные событий для анализа
    const eventData = events.map(event => ({
      id: event.id,
      sportId: event.sportId,
      sportName: sportsMap.get(event.sportId)?.name || 'Unknown',
      league: event.league,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      startTime: event.startTime,
      odds: event.odds,
      popular: event.popular
    }));
    
    // Анализируем события с помощью OpenAI (GPT-4.5 Turbo)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-01", // Используем GPT-4.5 Turbo
      messages: [
        {
          role: "system",
          content: `Вы - спортивный аналитик и эксперт по ставкам на спорт. 
          Проанализируйте следующие предстоящие спортивные события и создайте 5 рекомендаций для ставок.
          
          Для каждой рекомендации предоставьте:
          1. ID события
          2. Тип ставки (например, "Исход матча", "Тотал больше/меньше", "Фора")
          3. Конкретный выбор (например, название команды или значение ставки)
          4. Оценку уверенности от 0.5 до 0.95
          5. Краткое обоснование рекомендации, основанное на статистике и аналитике
          6. Является ли это популярной ставкой (true/false)
          7. Является ли это ценной ставкой с хорошим коэффициентом (true/false)
          
          Рекомендации должны быть глубоко аналитическими и учитывать:
          - Исторические результаты команд
          - Текущую форму
          - Статистические тренды
          - Ценность предлагаемых коэффициентов
          
          Ответьте корректным JSON в следующем формате:
          {
            "recommendations": [
              {
                "eventId": number,
                "betType": string,
                "selection": string,
                "confidence": number,
                "reasoning": string,
                "isTrending": boolean,
                "isValueBet": boolean
              }
            ]
          }`
        },
        {
          role: "user",
          content: JSON.stringify(eventData)
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Создаем рекомендации
    const recommendations: InsertRecommendation[] = [];
    
    for (const rec of result.recommendations || []) {
      const recommendation: InsertRecommendation = {
        eventId: rec.eventId,
        betType: rec.betType,
        selection: rec.selection,
        confidence: rec.confidence,
        reasoning: rec.reasoning,
        isTrending: rec.isTrending || false,
        isValueBet: rec.isValueBet || false
      };
      
      try {
        const savedRec = await storage.createRecommendation(recommendation);
        recommendations.push(savedRec);
      } catch (err) {
        console.error(`Ошибка сохранения рекомендации для события ${rec.eventId}:`, err);
      }
    }
    
    return recommendations;
  } catch (error: any) {
    if (error?.status === 429) {
      console.error("Ошибка OpenAI API: превышен лимит запросов при генерации рекомендаций");
    } else {
      console.error("Ошибка генерации рекомендаций:", error);
    }
    return [];
  }
}

/**
 * Генерирует детальный прогноз для конкретного спортивного события
 * @param eventId ID события
 */
export async function generateEventPrediction(eventId: number): Promise<EventPrediction | null> {
  try {
    // Получаем информацию о событии
    const event = await storage.getEvent(eventId);
    if (!event) {
      throw new Error(`Событие с ID ${eventId} не найдено`);
    }
    
    // Получаем вид спорта
    const sport = await storage.getSport(event.sportId);
    
    // Получаем другие события из той же лиги для контекста
    const leagueEvents = await storage.getEventsBySport(event.sportId);
    
    // Формируем контекст для анализа
    const context = {
      event: {
        id: event.id,
        sportId: event.sportId,
        sportName: sport?.name || 'Unknown',
        league: event.league,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        startTime: event.startTime,
        odds: event.odds
      },
      leagueContext: leagueEvents
        .filter(e => e.id !== eventId && e.league === event.league)
        .slice(0, 5)
        .map(e => ({
          homeTeam: e.homeTeam,
          awayTeam: e.awayTeam,
          homeScore: e.homeScore,
          awayScore: e.awayScore,
          status: e.status
        }))
    };
    
    // Анализируем с помощью OpenAI (GPT-4.5 Turbo)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-01", // Используем GPT-4.5 Turbo
      messages: [
        {
          role: "system",
          content: `Вы - спортивный аналитик и эксперт по ставкам на спорт. 
          Проанализируйте подробно предстоящее спортивное событие и создайте детальный прогноз.
          
          Ваш анализ должен включать:
          1. Вероятность победы домашней команды (число от 0 до 1)
          2. Вероятность ничьей (число от 0 до 1) 
          3. Вероятность победы гостевой команды (число от 0 до 1)
          4. Прогноз счета матча
          5. Ключевые факторы, влияющие на исход (минимум 3)
          6. Лучшие ставки для этого события (минимум 3 различных типа ставок)
          7. Детальный анализ события
          
          Ваш анализ должен быть основан на:
          - Исторических результатах команд
          - Текущей форме
          - Важности матча
          - Стилях игры
          - Особенностях лиги
          - Ценности предлагаемых коэффициентов
          
          Ответьте корректным JSON в следующем формате:
          {
            "homeWinProbability": number,
            "drawProbability": number,
            "awayWinProbability": number,
            "predictedScore": { "home": number, "away": number },
            "keyFactors": [string, string, string],
            "bestBets": [
              {
                "type": string,
                "selection": string,
                "odds": number,
                "valueRating": number,
                "confidence": number,
                "explanation": string
              }
            ],
            "analysis": string
          }`
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(response.choices[0].message.content || "{}") as EventPrediction;
    
  } catch (error: any) {
    if (error?.status === 429) {
      console.error(`Ошибка OpenAI API (превышен лимит запросов) для события ${eventId}`);
    } else {
      console.error(`Ошибка генерации прогноза для события ${eventId}:`, error);
    }
    return null;
  }
}

/**
 * Генерирует рекомендации для конкретного пользователя на основе его истории ставок
 * @param userId ID пользователя
 */
export async function generatePersonalizedRecommendations(userId: number): Promise<InsertRecommendation[]> {
  try {
    // Получаем историю ставок пользователя
    const userBets = await storage.getUserBets(userId);
    
    if (userBets.length === 0) {
      // Если у пользователя нет истории ставок, возвращаем общие рекомендации
      return generateRecommendations();
    }
    
    // Получаем предстоящие события
    const upcomingEvents = await storage.getUpcomingEvents(15);
    if (upcomingEvents.length === 0) {
      return [];
    }
    
    // Получаем спорты для контекста
    const sports = await storage.getAllSports();
    const sportsMap = new Map<number, Sport>();
    sports.forEach(sport => sportsMap.set(sport.id, sport));
    
    // Подготавливаем данные о пользователе и его ставках
    const userBetHistory = userBets.map(bet => ({
      eventId: bet.eventId,
      betType: bet.betType,
      selection: bet.selection,
      odds: bet.odds,
      stake: bet.stake,
      status: bet.status,
      potentialPayout: bet.potentialWin // используем potentialWin как potentialPayout
    }));
    
    // Подготавливаем данные о предстоящих событиях
    const eventData = upcomingEvents.map(event => ({
      id: event.id,
      sportId: event.sportId,
      sportName: sportsMap.get(event.sportId)?.name || 'Unknown',
      league: event.league,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      startTime: event.startTime,
      odds: event.odds,
      popular: event.popular
    }));
    
    // Анализируем с помощью OpenAI (GPT-4.5 Turbo)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-01", // Используем GPT-4.5 Turbo
      messages: [
        {
          role: "system",
          content: `Вы - персональный советник по ставкам на спорт. 
          На основе истории ставок пользователя и доступных предстоящих событий, создайте 5 персонализированных рекомендаций.
          
          Для каждой рекомендации предоставьте:
          1. ID события
          2. Тип ставки (например, "Исход матча", "Тотал больше/меньше", "Фора")
          3. Конкретный выбор (например, название команды или значение ставки)
          4. Оценку уверенности от 0.5 до 0.95
          5. Персонализированное обоснование, учитывающее предпочтения пользователя
          6. Является ли это популярной ставкой (true/false)
          7. Является ли это ценной ставкой с хорошим коэффициентом (true/false)
          
          Рекомендации должны:
          - Учитывать предпочтения пользователя (виды спорта, лиги, типы ставок)
          - Соответствовать стилю ставок пользователя (рискованные или консервативные)
          - Предлагать разнообразие (разные виды спорта, типы ставок)
          - Включать аналитические обоснования
          
          Ответьте корректным JSON в следующем формате:
          {
            "recommendations": [
              {
                "eventId": number,
                "betType": string,
                "selection": string,
                "confidence": number,
                "reasoning": string,
                "isTrending": boolean,
                "isValueBet": boolean
              }
            ]
          }`
        },
        {
          role: "user",
          content: JSON.stringify({
            userBetHistory,
            upcomingEvents: eventData
          })
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Создаем персонализированные рекомендации
    const recommendations: InsertRecommendation[] = [];
    
    for (const rec of result.recommendations || []) {
      const recommendation: InsertRecommendation = {
        eventId: rec.eventId,
        betType: rec.betType,
        selection: rec.selection,
        confidence: rec.confidence,
        reasoning: rec.reasoning,
        isTrending: rec.isTrending || false,
        isValueBet: rec.isValueBet || false
      };
      
      recommendations.push(recommendation);
    }
    
    return recommendations;
  } catch (error: any) {
    if (error?.status === 429) {
      console.error(`Ошибка OpenAI API: превышен лимит запросов при генерации рекомендаций для пользователя ${userId}`);
    } else {
      console.error(`Ошибка генерации персонализированных рекомендаций для пользователя ${userId}:`, error);
    }
    return [];
  }
}
