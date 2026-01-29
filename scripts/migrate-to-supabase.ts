
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateSaints() {
  console.log('Migrating Saints...');
  const filePath = path.join(process.cwd(), 'public/data/saints_data.json');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️ saints_data.json not found');
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Found ${data.length} saints.`);

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((s: any) => ({
      date_str: s.date,
      name: s.name,
      type: s.type,
      bio: s.bio,
      region: s.region || 'WORLD',
      is_primary: s.is_primary
    }));

    const { error } = await supabase.from('saints').insert(batch);
    if (error) console.error('Error inserting saints batch:', error);
    else console.log(`Inserted saints ${i} to ${i + batch.length}`);
  }
}

async function migrateBooks() {
  console.log('Migrating Books...');
  const filePath = path.join(process.cwd(), 'public/data/recommended_books.json');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️ recommended_books.json not found');
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let booksToInsert: any[] = [];

  // Structure: { categories: [ { name: "...", books: [...] } ] }
  if (data.categories && Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      const categoryName = cat.name;
      if (cat.books && Array.isArray(cat.books)) {
        for (const b of cat.books) {
          booksToInsert.push({
            category: categoryName,
            title: b.title,
            author: b.author,
            description: b.description || null,
            url: b.url || b.link || null
          });
        }
      }
    }
  }

  console.log(`Found ${booksToInsert.length} books.`);
  const { error } = await supabase.from('books').insert(booksToInsert);
  if (error) console.error('Error inserting books:', error);
  else console.log('✅ Books migrated successfully.');
}

async function migrateRegional() {
  // Already migrated
  console.log('Skipping Regional Data (Already Migrated)');
  /*
  console.log('Migrating Regional Data...');
  const filePath = path.join(process.cwd(), 'public/data/regional_church_data_full.json');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️ regional_church_data_full.json not found');
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Found ${data.length} regional documents.`);

  const batch = data.map((d: any) => ({
    region: d.region,
    country: ['AR', 'PE', 'ES', 'BR', 'CO', 'MX', 'CL'].includes(d.region) ? d.region : null,
    source_type: d.source_type,
    title: d.title,
    content: d.content,
    url: d.url
  }));

  const { error } = await supabase.from('regional_data').insert(batch);
  if (error) console.error('Error inserting regional data:', error);
  else console.log('✅ Regional data migrated successfully.');
  */
}

// Execute
async function main() {
  // await migrateSaints(); // Already migrated
  await migrateBooks();
  await migrateRegional(); // Will skip
}

main().catch(console.error);
