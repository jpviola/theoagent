
import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';

export async function uploadToSnowflake(): Promise<{ success: boolean; message: string }> {
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH';
  const database = process.env.SNOWFLAKE_DATABASE || 'SANTAPALABRA_DB';
  const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';
  const role = process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN';

  if (!account || !username || !password) {
    return { 
      success: false, 
      message: 'Missing Snowflake credentials in .env.local (SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD)' 
    };
  }

  const connection = snowflake.createConnection({
    account,
    username,
    password,
    warehouse,
    database,
    schema,
    role,
    application: 'SantaPalabra_Ingestion'
  });

  return new Promise((resolve) => {
    connection.connect(async (err, conn) => {
      if (err) {
        console.error('Unable to connect to Snowflake: ' + err.message);
        resolve({ success: false, message: 'Snowflake Connection Failed: ' + err.message });
        return;
      }

      try {
        console.log('❄️ Connected to Snowflake. Preparing to upload...');
        
        // 1. Read CSV File
        const csvPath = path.join(process.cwd(), 'datasets', 'snowflake_import.csv');
        if (!fs.existsSync(csvPath)) {
            resolve({ success: false, message: 'CSV file not found. Run "Prepare Dataset" first.' });
            return;
        }

        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const rows = csvContent.split('\n').slice(1); // Skip header

        if (rows.length === 0) {
           resolve({ success: true, message: 'No data to upload.' });
           return;
        }

        // 2. Ensure Table Exists
        // Table structure: id, source, title, content, created_at
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS RAW_DATA_INGESTION (
            ID STRING,
            SOURCE STRING,
            TITLE STRING,
            CONTENT STRING,
            CREATED_AT TIMESTAMP_NTZ
          )
        `;

        await executeQuery(conn, createTableQuery);
        console.log('✅ Table ensured.');

        // 3. Insert Data (Batch Insert)
        // For large datasets, we should use internal stage + COPY INTO.
        // For this MVP, we will construct a multi-value INSERT.
        // Be careful with SQL injection and limits. We'll do batches of 50.
        
        const BATCH_SIZE = 50;
        let insertedCount = 0;

        // Simple CSV parser for quoted fields (very basic)
        // We actually already have the raw data in memory in 'dataset-service.ts', 
        // but to keep modules decoupled we read the CSV. 
        // A better approach for robust CSV reading is using a library, but let's try a regex for splitting
        // Since we generated the CSV, we know the format: "val","val","val"...
        
        // Regex to match: "([^"]*)"
        // But let's just use the file content carefully.
        
        const parseCSVRow = (row: string) => {
             // Basic parser: assumes "col1","col2",... 
             // and no escaped quotes inside quotes for now (our generator does replace " with "" but simple split might fail on commas inside)
             // Let's use a regex to match fields
             const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
             // This is tricky. Let's revert to a simpler approach:
             // Since we control the generator, let's use a simpler insert method or use a proper CSV parser if needed.
             // Or better: Use the JSON files from `public/data/ingested` directly! It's safer.
             return null; 
        };

        // ALTERNATIVE: Read JSONs again. It's safer than parsing CSV manually.
        const ingestedDir = path.join(process.cwd(), 'public', 'data', 'ingested');
        const files = fs.readdirSync(ingestedDir).filter(f => f.endsWith('.json'));
        
        let totalRows = 0;
        let currentBatch: any[] = [];

        for (const file of files) {
            const content = fs.readFileSync(path.join(ingestedDir, file), 'utf-8');
            const items = JSON.parse(content);
            
            for (const item of items) {
                currentBatch.push(item);
                if (currentBatch.length >= BATCH_SIZE) {
                    await insertBatch(conn, currentBatch);
                    insertedCount += currentBatch.length;
                    currentBatch = [];
                }
            }
        }
        
        if (currentBatch.length > 0) {
            await insertBatch(conn, currentBatch);
            insertedCount += currentBatch.length;
        }

        resolve({ success: true, message: `Successfully uploaded ${insertedCount} rows to Snowflake.` });

      } catch (e: any) {
        console.error('Snowflake Operation Error:', e);
        resolve({ success: false, message: 'Error during Snowflake upload: ' + e.message });
      } finally {
         /*
         // Destroy connection is not always necessary if we want to keep it, 
         // but for a serverless function we should destroy it or it might hang.
         */
         /* conn.destroy((err, conn) => {
             if (err) console.error('Error destroying connection:', err);
         }); */
      }
    });
  });
}

async function executeQuery(conn: snowflake.Connection, sqlText: string, binds?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
        conn.execute({
            sqlText,
            binds,
            complete: (err, stmt, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        });
    });
}

async function insertBatch(conn: snowflake.Connection, items: any[]) {
    if (items.length === 0) return;

    // Construct values string: (?,?,?,?,?), (?,?,?,?,?)...
    const valuesPlaceholders = items.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const query = `INSERT INTO RAW_DATA_INGESTION (ID, SOURCE, TITLE, CONTENT, CREATED_AT) VALUES ${valuesPlaceholders}`;
    
    const binds: any[] = [];
    items.forEach(item => {
        binds.push(item.guid || item.id);
        binds.push(item.source || 'Unknown');
        binds.push(item.title || '');
        binds.push(item.description || item.content || ''); // Use description or content
        binds.push(item.ingestedAt || new Date().toISOString());
    });

    await executeQuery(conn, query, binds);
}
