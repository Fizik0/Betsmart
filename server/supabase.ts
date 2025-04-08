import { createClient } from '@supabase/supabase-js';
import { log } from './vite';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY. Please set these environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

log('Supabase client initialized', 'supabase');

// Utility functions for working with Supabase

/**
 * Fetches all rows from a table
 */
export async function getAll<T>(
  table: string,
  options?: {
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
  }
): Promise<T[]> {
  let query = supabase.from(table).select('*');
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.orderBy) {
    const { column, ascending = true } = options.orderBy;
    query = query.order(column, { ascending });
  }
  
  const { data, error } = await query;
  
  if (error) {
    log(`Error fetching from ${table}: ${error.message}`, 'supabase');
    throw error;
  }
  
  return data as T[];
}

/**
 * Fetches a row by ID
 */
export async function getById<T>(
  table: string,
  id: number
): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    log(`Error fetching ${table} with id ${id}: ${error.message}`, 'supabase');
    throw error;
  }
  
  return data as T;
}

/**
 * Inserts a new row
 */
export async function insert<T, U>(
  table: string,
  data: U
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  
  if (error) {
    log(`Error inserting into ${table}: ${error.message}`, 'supabase');
    throw error;
  }
  
  return result as T;
}

/**
 * Updates a row by ID
 */
export async function update<T, U>(
  table: string,
  id: number,
  data: Partial<U>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    log(`Error updating ${table} with id ${id}: ${error.message}`, 'supabase');
    throw error;
  }
  
  return result as T;
}

/**
 * Deletes a row by ID
 */
export async function remove(
  table: string,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    log(`Error deleting from ${table} with id ${id}: ${error.message}`, 'supabase');
    throw error;
  }
}

/**
 * Fetches rows by a column value
 */
export async function getByColumn<T>(
  table: string,
  column: string,
  value: any
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(column, value);
  
  if (error) {
    log(`Error fetching ${table} by ${column}: ${error.message}`, 'supabase');
    throw error;
  }
  
  return data as T[];
}

/**
 * Executes a custom query with filtering
 */
export async function query<T>(
  table: string,
  filters: Record<string, any>,
  options?: {
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
  }
): Promise<T[]> {
  let query = supabase.from(table).select('*');
  
  // Apply filters
  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.orderBy) {
    const { column, ascending = true } = options.orderBy;
    query = query.order(column, { ascending });
  }
  
  const { data, error } = await query;
  
  if (error) {
    log(`Error querying ${table}: ${error.message}`, 'supabase');
    throw error;
  }
  
  return data as T[];
}