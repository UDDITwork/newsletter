import { createClient } from '@libsql/client/web';
import { schema } from './schema.js';

async function migrate() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  const db = createClient({ url, authToken });

  console.log('Running migrations...');

  // Split schema into individual statements and execute
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await db.execute(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    } catch (error) {
      console.error('Error executing statement:', statement);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('Migrations completed successfully!');
  process.exit(0);
}

migrate();
