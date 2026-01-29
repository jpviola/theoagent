
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';
import { Document } from '@langchain/core/documents';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Try OpenAI Key first, then OpenRouter/VLLM key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VLLM_API_KEY = process.env.VLLM_API_KEY || process.env.OPENROUTER_GEMMA_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

if (!OPENAI_API_KEY && !VLLM_API_KEY) {
    console.error('❌ Missing API Key for embeddings (OPENAI_API_KEY or VLLM_API_KEY)');
    process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_API_KEY || VLLM_API_KEY,
  modelName: OPENAI_API_KEY ? 'text-embedding-3-small' : 'openai/text-embedding-3-small',
  batchSize: 512,
  configuration: OPENAI_API_KEY ? undefined : {
    baseURL: 'https://openrouter.ai/api/v1',
  }
});

const DATA_DIR = path.join(process.cwd(), 'public/data');

// Files to migrate - Prioritize the large ones that were causing issues
const FILES_TO_MIGRATE: string[] = [
  // Already migrated:
  // 'catechism.json',
  // 'papal_magisterium.json',
  // 'custom_teachings.json',
  // 'gospel_parables.json',
  // 'biblical_theology.json',
  // 'celam_latinoamerica.json',
  // 'espiritualidad_hispanoamericana.json',
  // 'dei_verbum_passages.json',
  // 'daily_gospel_reflections.json',
  // 'difficult_passages.json',
  // 'gospel_passages_greek.json',
  // 'church_history.json',

  // New regional data:
  // 'regional_church_data.json',

  // Pending (Small/Medium):

  // Large files (Uncomment with caution - expensive/slow):
  // 'dogmatic_theology.json', // ~73MB
  // 'bible_study_plan.json', // ~245MB
];

async function loadAndMigrate() {
  console.log('🚀 Starting migration to Supabase...');

  for (const filename of FILES_TO_MIGRATE) {
    const filePath = path.join(DATA_DIR, filename);
    
    try {
      console.log(`\n📄 Processing ${filename}...`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      let documentsToProcess = data;
      if (!Array.isArray(data)) {
        // Check for common root properties
        if (data.papal_documents && Array.isArray(data.papal_documents)) {
            documentsToProcess = data.papal_documents;
        } else if (data.documents && Array.isArray(data.documents)) {
            documentsToProcess = data.documents;
        } else {
            console.warn(`⚠️ ${filename} is not an array and no known root property found, skipping.`);
            continue;
        }
      }

      const documents: Document[] = [];

      // Convert to LangChain Documents
      documentsToProcess.forEach((item: any, index: number) => {
        // Handle different schemas in JSONs
        const content = item.text || item.content || item.passage || JSON.stringify(item);
        const title = item.title || item.heading || item.name || `Entry ${index + 1}`;
        const source = item.source || filename.replace('.json', '');
        
        // Determine category
        let category = 'custom';
        if (filename.includes('catechism')) category = 'catechism';
        else if (filename.includes('papal')) category = 'papal';
        else if (filename.includes('gospel')) category = 'scripture';

        if (content && content.length > 10) { // Skip empty/tiny docs
            documents.push(new Document({
                pageContent: content,
                metadata: {
                    title,
                    source,
                    category,
                    original_id: item.id || `${filename}-${index}`
                }
            }));
        }
      });

      // Deletion logic moved here - assuming majority source
      const mainSource = filename.replace('.json', '');
      console.log(`🧹 Clearing existing documents for source: ${mainSource}...`);
      const { error: deleteError } = await client
        .from('documents')
        .delete()
        .filter('metadata->>source', 'eq', mainSource);

      if (deleteError) {
        console.warn(`⚠️ Error clearing documents (might be empty):`, deleteError);
      }

      console.log(`✅ Loaded ${documents.length} documents from ${filename}. Generating embeddings and uploading...`);

      // Upload in batches to avoid timeouts/rate limits
      const BATCH_SIZE = 100;
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        
        await SupabaseVectorStore.fromDocuments(
          batch,
          embeddings,
          {
            client,
            tableName: 'documents',
            queryName: 'match_documents',
          }
        );
        
        process.stdout.write(`.`);
      }
      console.log(`\n🎉 Finished uploading ${filename}`);

    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error);
    }
  }

  console.log('\n✅ Migration complete!');
}

loadAndMigrate().catch(console.error);
