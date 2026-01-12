import { db } from './client.js';
import { schema } from './schema.js';

export async function runMigrations() {
  console.log('Running database migrations...');

  // Split schema into individual statements and execute
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error: any) {
      // Ignore "table already exists" errors
      if (!error.message?.includes('already exists')) {
        console.error('Migration error:', error);
        throw error;
      }
    }
  }

  console.log('Database migrations completed successfully!');
}
