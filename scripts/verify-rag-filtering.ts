
import fs from 'fs';
import path from 'path';

// Mock types
interface CatholicDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'catechism' | 'papal' | 'scripture' | 'custom' | 'dogmatic' | 'history';
}

async function verifyRagLogic() {
  console.log('🚀 Verifying RAG Logic for Study Tracks...');

  const publicDir = path.join(process.cwd(), 'public', 'data');
  const files = [
    'bible_study_plan.json',
    'biblical_theology.json',
    'dogmatic_theology.json'
  ];

  const documents: CatholicDocument[] = [];

  for (const filename of files) {
    try {
      const filePath = path.join(publicDir, filename);
      if (!fs.existsSync(filePath)) {
          console.log(`⚠️ File not found: ${filename}`);
          continue;
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (Array.isArray(data)) {
        data.forEach((item: any, index: number) => {
          // Logic from langchain-rag.ts
          let category: 'catechism' | 'papal' | 'scripture' | 'custom' | 'dogmatic' | 'history' = 'custom';
          
          if (filename.includes('catechism')) category = 'catechism';
          else if (filename.includes('papal')) category = 'papal';
          else if (filename.includes('scripture') || filename.includes('gospel') || filename.includes('dei_verbum') || filename.includes('biblical_theology') || filename.includes('bible_study')) category = 'scripture';
          else if (filename.includes('dogmatic_theology')) category = 'dogmatic';
          else if (filename.includes('church_history')) category = 'history';

          documents.push({
            id: `${filename}-${index}`,
            title: item.title || `Entry ${index + 1}`,
            content: item.text || item.content || '',
            source: item.source || filename.replace('.json', ''),
            category: category
          });
        });
      }
      console.log(`✅ Loaded ${filename}: ${data.length} docs`);
    } catch (error) {
      console.error(`❌ Error loading ${filename}:`, error);
    }
  }

  console.log(`📚 Total documents loaded: ${documents.length}`);

  // Test Filter for 'bible-study-plan'
  const bibleStudyDocs = documents.filter(doc => 
    doc.category === 'scripture' || 
    doc.source === 'daily_gospel_reflections' ||
    doc.source === 'bible_study_plan'
  );
  console.log(`\n🔍 'bible-study-plan' track docs: ${bibleStudyDocs.length}`);
  if (bibleStudyDocs.length > 0) {
      console.log(`   Sample: ${bibleStudyDocs[0].title} (Category: ${bibleStudyDocs[0].category})`);
  }

  // Test Filter for 'dogmatic-theology'
  const dogmaticDocs = documents.filter(doc => 
    doc.category === 'catechism' || 
    doc.category === 'papal' ||
    doc.category === 'dogmatic'
  );
  console.log(`\n🔍 'dogmatic-theology' track docs: ${dogmaticDocs.length}`);
    if (dogmaticDocs.length > 0) {
      console.log(`   Sample: ${dogmaticDocs[0].title} (Category: ${dogmaticDocs[0].category})`);
  }

}

verifyRagLogic();
