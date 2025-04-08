import { db } from '../server/db';
import { log } from '../server/vite';
import { 
  sports, events, liveStreams, liveStreamStats, recommendations, bets, users 
} from '@shared/schema';
import { storage } from '../server/storage';

/**
 * Скрипт для сброса данных в базе данных и повторного заполнения их актуальными данными
 */
async function resetDatabase() {
  try {
    log('Starting database reset...', 'db-reset');
    
    // Удаляем данные из таблиц в правильном порядке (из-за foreign key constraints)
    log('Deleting existing data...', 'db-reset');
    await db.delete(liveStreamStats);
    await db.delete(liveStreams);
    await db.delete(recommendations);
    await db.delete(bets);
    await db.delete(events);
    await db.delete(sports);
    
    log('All data deleted successfully', 'db-reset');
    
    // Заполняем базу новыми данными
    log('Seeding new data...', 'db-reset');
    await storage.seedInitialData();
    
    log('Database reset and seed completed successfully!', 'db-reset');
    process.exit(0);
  } catch (error) {
    log(`Error during database reset: ${error}`, 'db-reset');
    process.exit(1);
  }
}

// Выполняем сброс и перезаполнение
resetDatabase();