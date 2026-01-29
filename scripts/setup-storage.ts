
import { createClient } from '@supabase/supabase-js';
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

async function setupStorage() {
  console.log('Setting up Supabase Storage...');

  const bucketName = 'media';
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucketExists = buckets.find(b => b.name === bucketName);

  if (bucketExists) {
    console.log(`✅ Bucket '${bucketName}' already exists.`);
  } else {
    console.log(`Creating bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'video/mp4', 'image/png', 'image/jpeg']
    });

    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log(`✅ Bucket '${bucketName}' created successfully.`);
    }
  }

  // Set up storage policies? 
  // Storage policies are usually set via SQL or Dashboard. The JS SDK doesn't manage policies easily.
  // But we can print instructions.
  console.log('\n⚠️  IMPORTANT: Storage Policies');
  console.log('You need to configure RLS policies for the "media" bucket in the Supabase Dashboard to allow public read access.');
}

setupStorage();
