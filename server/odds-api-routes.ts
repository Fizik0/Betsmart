/**
 * Маршруты для работы с The Odds API
 */

import { Express, Request, Response } from 'express';
import * as oddsApi from './odds-api';
import { createEvent, getEventById } from './db-utils';
import { storage } from './storage';
import { log } from './vite';
import { InsertEvent } from '@shared/schema';

/**
 * Регистрирует маршруты API для работы с The Odds API
 */
export function registerOddsApiRoutes(app: Express) {
  // Проверка статуса API
  app.get('/api/odds-api/status', async (req, res) => {
    try {
      const status = await oddsApi.checkApiStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to check API status: ${error}` 
      });
    }
  });

  // Получить список поддерживаемых спортов
  app.get('/api/odds-api/sports', async (req, res) => {
    try {
      const sports = await oddsApi.fetchSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to fetch sports: ${error}` 
      });
    }
  });

  // Получить события для определенного спорта
  app.get('/api/odds-api/sports/:sportKey/odds', async (req, res) => {
    try {
      const { sportKey } = req.params;
      const { regions, markets } = req.query;
      
      const events = await oddsApi.fetchOddsForSport(
        sportKey, 
        regions as string, 
        markets as string
      );
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to fetch odds: ${error}` 
      });
    }
  });

  // Обновить все события (импортировать из API в базу данных)
  app.post('/api/odds-api/update-events', async (req, res) => {
    try {
      // Проверяем лимиты использования API
      const apiStatus = await oddsApi.checkApiStatus();
      
      if (apiStatus.status === 'error') {
        return res.status(500).json({
          status: 'error',
          message: apiStatus.message
        });
      }
      
      if (apiStatus.usage && apiStatus.usage.remaining < 5) {
        return res.status(429).json({
          status: 'error',
          message: `API rate limit almost reached. Only ${apiStatus.usage.remaining} requests remaining. Try again later.`,
          usage: apiStatus.usage
        });
      }
      
      // Получаем события из The Odds API
      const events = await oddsApi.fetchAllUpcomingEvents();
      log(`[odds-api-route] Fetched ${events.length} events from API`, 'odds-api');
      
      // Импортируем события в нашу базу данных
      let importedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;
      
      for (const event of events) {
        try {
          // Проверяем, существует ли уже событие с таким же названием и временем
          const existingEvents = await storage.getUpcomingEvents(100);
          const existingEvent = existingEvents.find(e => 
            e.homeTeam === event.homeTeam && 
            e.awayTeam === event.awayTeam &&
            new Date(e.startTime).getTime() === new Date(event.startTime).getTime()
          );
          
          if (existingEvent) {
            // Обновляем существующее событие
            await storage.updateEvent(existingEvent.id, {
              odds: event.odds,
              status: event.status,
              isLive: event.isLive,
            });
            updatedCount++;
          } else {
            // Создаем новое событие
            await createEvent(event);
            importedCount++;
          }
        } catch (error) {
          log(`[odds-api-route] Failed to import event: ${error}`, 'odds-api-error');
          failedCount++;
        }
      }
      
      // Возвращаем результат импорта
      res.json({
        status: 'success',
        message: `Events updated successfully. Imported: ${importedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`,
        counts: {
          total: events.length,
          imported: importedCount,
          updated: updatedCount,
          failed: failedCount
        },
        usage: apiStatus.usage
      });
      
    } catch (error) {
      log(`[odds-api-route] Error updating events: ${error}`, 'odds-api-error');
      res.status(500).json({ 
        status: 'error', 
        message: `Failed to update events: ${error}` 
      });
    }
  });

  // Настраиваем периодическое обновление данных (каждые 3 часа)
  setupPeriodicUpdates();
  
  log('[odds-api-routes] Registered The Odds API routes', 'odds-api');
}

/**
 * Настраивает периодическое обновление данных из The Odds API
 */
function setupPeriodicUpdates() {
  // Обновляем данные при запуске приложения
  setTimeout(async () => {
    try {
      log('[odds-api] Starting initial data update...', 'odds-api');
      
      const apiStatus = await oddsApi.checkApiStatus();
      if (apiStatus.status === 'error' || (apiStatus.usage && apiStatus.usage.remaining < 5)) {
        log(`[odds-api] Skipping initial update due to API limitations: ${apiStatus.message}`, 'odds-api');
        return;
      }
      
      const events = await oddsApi.fetchAllUpcomingEvents();
      log(`[odds-api] Fetched ${events.length} events from API`, 'odds-api');
      
      let imported = 0;
      let updated = 0;
      
      for (const event of events) {
        try {
          // Проверяем, существует ли уже событие с таким же названием и временем
          const existingEvents = await storage.getUpcomingEvents(100);
          const existingEvent = existingEvents.find(e => 
            e.homeTeam === event.homeTeam && 
            e.awayTeam === event.awayTeam &&
            new Date(e.startTime).getTime() === new Date(event.startTime).getTime()
          );
          
          if (existingEvent) {
            // Обновляем существующее событие
            await storage.updateEvent(existingEvent.id, {
              odds: event.odds,
              status: event.status,
              isLive: event.isLive,
            });
            updated++;
          } else {
            // Создаем новое событие
            await createEvent(event);
            imported++;
          }
        } catch (error) {
          log(`[odds-api] Failed to import/update event: ${error}`, 'odds-api-error');
        }
      }
      
      log(`[odds-api] Initial update completed. Imported: ${imported}, Updated: ${updated}`, 'odds-api');
    } catch (error) {
      log(`[odds-api] Error during initial update: ${error}`, 'odds-api-error');
    }
  }, 10000); // Задержка 10 секунд после запуска, чтобы дать приложению полностью загрузиться
  
  // Затем обновляем каждые 3 часа
  setInterval(async () => {
    try {
      log('[odds-api] Starting scheduled data update...', 'odds-api');
      
      const apiStatus = await oddsApi.checkApiStatus();
      if (apiStatus.status === 'error' || (apiStatus.usage && apiStatus.usage.remaining < 5)) {
        log(`[odds-api] Skipping scheduled update due to API limitations: ${apiStatus.message}`, 'odds-api');
        return;
      }
      
      const events = await oddsApi.fetchAllUpcomingEvents();
      log(`[odds-api] Fetched ${events.length} events from API`, 'odds-api');
      
      let imported = 0;
      let updated = 0;
      
      for (const event of events) {
        try {
          // Проверяем, существует ли уже событие с таким же названием и временем
          const existingEvents = await storage.getUpcomingEvents(100);
          const existingEvent = existingEvents.find(e => 
            e.homeTeam === event.homeTeam && 
            e.awayTeam === event.awayTeam &&
            new Date(e.startTime).getTime() === new Date(event.startTime).getTime()
          );
          
          if (existingEvent) {
            // Обновляем существующее событие
            await storage.updateEvent(existingEvent.id, {
              odds: event.odds,
              status: event.status,
              isLive: event.isLive,
            });
            updated++;
          } else {
            // Создаем новое событие
            await createEvent(event);
            imported++;
          }
        } catch (error) {
          log(`[odds-api] Failed to import/update event: ${error}`, 'odds-api-error');
        }
      }
      
      log(`[odds-api] Scheduled update completed. Imported: ${imported}, Updated: ${updated}`, 'odds-api');
    } catch (error) {
      log(`[odds-api] Error during scheduled update: ${error}`, 'odds-api-error');
    }
  }, 3 * 60 * 60 * 1000); // 3 часа в миллисекундах
}