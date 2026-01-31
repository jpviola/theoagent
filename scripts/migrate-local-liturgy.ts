
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const LOCAL_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'liturgy', 'liturgy_index.json');

async function migrate() {
  console.log('Starting migration of local Liturgy JSON to Supabase...');

  if (!fs.existsSync(LOCAL_DATA_PATH)) {
    console.error('Error: Local data file not found:', LOCAL_DATA_PATH);
    process.exit(1);
  }

  const rawData = fs.readFileSync(LOCAL_DATA_PATH, 'utf-8');
  const liturgyDays = JSON.parse(rawData);

  console.log(`Found ${liturgyDays.length} days to process.`);

  const batchSize = 50;
  let processedCount = 0;
  let batch = [];

  for (const day of liturgyDays) {
    const { date, url, title, hours } = day;

    if (!hours) continue;

    for (const [hourKey, content] of Object.entries(hours)) {
      // Clean hour key (remove † and trim)
      const hourType = hourKey.replace(/[†]/g, '').trim().toLowerCase();

      batch.push({
        date,
        hour_type: hourType,
        title,
        url,
        content_html: content
      });

      if (batch.length >= batchSize) {
        await upsertBatch(batch);
        processedCount += batch.length;
        console.log(`Processed ${processedCount} entries...`);
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    await upsertBatch(batch);
    processedCount += batch.length;
  }

  console.log(`Migration completed! Total entries processed: ${processedCount}`);
}

async function upsertBatch(batch: any[]) {
  const { error } = await supabase
    .from('liturgy_hours')
    .upsert(batch, { 
      onConflict: 'date,hour_type',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error upserting batch:', error);
    if (error.code === '42P01') { // undefined_table
        console.error("CRITICAL: Table 'liturgy_hours' does not exist. Please run the SQL schema first.");
        process.exit(1);
    }
    throw error;
  }
}

migrate().catch(console.error);
