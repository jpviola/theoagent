import fs from 'fs';
import path from 'path';

interface FineTuningExample {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

export async function prepareSnowflakeDataset(): Promise<{ success: boolean; count: number; filePath: string; message?: string }> {
  try {
    const ingestedDir = path.join(process.cwd(), 'public', 'data', 'ingested');
    const outputDir = path.join(process.cwd(), 'datasets');
    const outputJsonlPath = path.join(outputDir, 'santa_palabra_finetune.jsonl');
    const outputCsvPath = path.join(outputDir, 'snowflake_import.csv');

    if (!fs.existsSync(ingestedDir)) {
      return { success: false, count: 0, filePath: '', message: 'No ingested data found to process.' };
    }

    const files = fs.readdirSync(ingestedDir).filter(f => f.endsWith('.json'));
    let totalExamples = 0;
    const examples: FineTuningExample[] = [];
    const csvRows: string[] = ['id,source,title,content,created_at']; // CSV Header for Snowflake

    console.log(`❄️ Preparing data for Snowflake/Fine-Tuning from ${files.length} files...`);

    for (const file of files) {
      const content = fs.readFileSync(path.join(ingestedDir, file), 'utf-8');
      const items = JSON.parse(content);

      for (const item of items) {
        // Create Fine-Tuning Example (Chat Format)
        // We assume the user asks about the news title, and the assistant provides the description/link.
        // This is a heuristic to generate training data from news.
        
        const systemPrompt = "Eres SantaPalabra, un asistente católico que informa sobre noticias de la Iglesia.";
        const userPrompt = `¿Qué novedades hay sobre: "${item.title}"?`;
        const assistantResponse = `${item.description}\n\nFuente: ${item.link}`;

        const example: FineTuningExample = {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: assistantResponse }
          ]
        };

        examples.push(example);

        // Prepare CSV row for Snowflake
        // Escape quotes for CSV
        const safeTitle = (item.title || '').replace(/"/g, '""');
        const safeDesc = (item.description || '').replace(/"/g, '""');
        const row = `"${item.guid}","${item.source}","${safeTitle}","${safeDesc}","${item.ingestedAt}"`;
        csvRows.push(row);

        totalExamples++;
      }
    }

    // Write JSONL (for LLM Training)
    const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(outputJsonlPath, jsonlContent);

    // Write CSV (for Snowflake)
    fs.writeFileSync(outputCsvPath, csvRows.join('\n'));

    return {
      success: true,
      count: totalExamples,
      filePath: outputCsvPath,
      message: `Successfully processed ${totalExamples} examples. \nJSONL: ${outputJsonlPath} \nCSV (Snowflake): ${outputCsvPath}`
    };

  } catch (error) {
    console.error('❌ Dataset Preparation Error:', error);
    return {
      success: false,
      count: 0,
      filePath: '',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
