
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Try fetching from Supabase
    const { data: dbData, error } = await supabase
      .from('liturgy_hours')
      .select('*')
      .order('date', { ascending: true });

    if (!error && dbData && dbData.length > 0) {
       // Transform to expected JSON structure
       const grouped: Record<string, any> = {};
       
       dbData.forEach((row: any) => {
           const dateStr = row.date; // "YYYY-MM-DD"
           if (!grouped[dateStr]) {
               grouped[dateStr] = {
                   date: dateStr,
                   url: row.url, 
                   title: row.title || 'Liturgia de las Horas',
                   hours: {},
                   scrapedAt: row.created_at
               };
           }
           
           grouped[dateStr].hours[row.hour_type] = row.content_html;
       });
       
       return NextResponse.json(Object.values(grouped));
    }

    // 2. Fallback to local JSON
    const dataPath = path.join(process.cwd(), 'src', 'data', 'liturgy', 'liturgy_index.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json([]);
    }
    
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading liturgy data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
