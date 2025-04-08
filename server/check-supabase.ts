import { supabase } from './supabase';
import { log } from './vite';

async function checkTables() {
  try {
    // Получаем список всех таблиц в схеме public
    const { data, error } = await supabase
      .from('_tables')
      .select('*');

    if (error) {
      log(`Error checking tables: ${error.message}`, 'check');
      return;
    }

    log(`Tables in database: ${JSON.stringify(data)}`, 'check');
  } catch (error: any) {
    log(`Error: ${error.message}`, 'check');
  }
}

// Проверяем соединение с Supabase
async function checkConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      log(`Connection error: ${error.message}`, 'check');
      return;
    }
    
    log(`Connected to Supabase successfully`, 'check');
    
    // Проверим наличие данных в таблице sports, если она существует
    try {
      const { data: sports, error: sportsError } = await supabase
        .from('sports')
        .select('*')
        .limit(1);
      
      if (sportsError) {
        log(`Error checking sports table: ${sportsError.message}`, 'check');
      } else {
        log(`Sports table exists with ${sports.length} records`, 'check');
      }
    } catch (error: any) {
      log(`Error checking sports table: ${error.message}`, 'check');
    }
  } catch (error: any) {
    log(`Error: ${error.message}`, 'check');
  }
}

checkConnection();