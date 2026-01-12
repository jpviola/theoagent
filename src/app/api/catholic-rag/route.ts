import { NextRequest, NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import fs from 'fs/promises';
import path from 'path';

// Ensure environment variable is available
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Function to retrieve Catholic documents
async function getCatholicTeaching(topic: string): Promise<string> {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'data');
    
    // Load Catholic documents
    const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
    const catechismEntries = JSON.parse(catechismData).slice(0, 50);
    
    // Load CELAM and Latin American documents 
    const celamData = await fs.readFile(path.join(publicDir, 'celam_latinoamerica.json'), 'utf-8');
    const celamEntries = JSON.parse(celamData).documents || [];
    
    // Load Spanish spirituality documents
    const spanishData = await fs.readFile(path.join(publicDir, 'espiritualidad_hispanoamericana.json'), 'utf-8');
    const spanishEntries = JSON.parse(spanishData).documents || [];
    
    // Load papal documents
    let papalEntries: any[] = [];
    try {
      const papalData = await fs.readFile(path.join(publicDir, 'papal_magisterium.json'), 'utf-8');
      papalEntries = JSON.parse(papalData).teachings?.slice(0, 30) || [];
    } catch (e) {
      console.log('Papal documents not found, continuing...');
    }
    
    const topicKeywords = topic.toLowerCase();
    
    // Search Spanish spirituality documents first (Hispanic priority) 
    const relevantSpanish = spanishEntries.filter((entry: any) => {
      const content = entry.content.toLowerCase();
      const title = entry.title.toLowerCase();
      return content.includes(topicKeywords) || title.includes(topicKeywords) ||
             (topicKeywords.includes('teresa') && (content.includes('teresa') || content.includes('moradas'))) ||
             (topicKeywords.includes('juan cruz') && (content.includes('juan') || content.includes('noche oscura'))) ||
             (topicKeywords.includes('ignacio') && (content.includes('ignacio') || content.includes('ejercicios'))) ||
             (topicKeywords.includes('mística') && entry.category?.includes('Mística')) ||
             (topicKeywords.includes('oración') && (content.includes('oración') || content.includes('contemplación'))) ||
             (topicKeywords.includes('santiago') && content.includes('santiago'));
    });
    
    // Search CELAM documents 
    const relevantCelam = celamEntries.filter((entry: any) => {
      const content = entry.content.toLowerCase();
      const title = entry.title.toLowerCase();
      return content.includes(topicKeywords) || title.includes(topicKeywords) ||
             (topicKeywords.includes('guadalupe') && (content.includes('guadalupe') || content.includes('maría'))) ||
             (topicKeywords.includes('américa latina') && (content.includes('américa') || content.includes('latino'))) ||
             (topicKeywords.includes('celam') && entry.category === 'CELAM') ||
             (topicKeywords.includes('liberación') && content.includes('liberación')) ||
             (topicKeywords.includes('evangelización') && content.includes('evangelización'));
    });
    
    // Search Catechism entries  
    const relevantCatechism = catechismEntries.filter((entry: any) => {
      if (!entry.text) return false;
      const text = entry.text.toLowerCase();
      
      return text.includes(topicKeywords) ||
             (topicKeywords.includes('trinity') && (text.includes('father') || text.includes('son') || text.includes('holy spirit') || text.includes('trinity'))) ||
             (topicKeywords.includes('prayer') && (text.includes('prayer') || text.includes('pray') || text.includes('worship'))) ||
             (topicKeywords.includes('mary') && (text.includes('mary') || text.includes('virgin') || text.includes('mother'))) ||
             (topicKeywords.includes('eucharist') && (text.includes('eucharist') || text.includes('communion') || text.includes('mass'))) ||
             (topicKeywords.includes('salvation') && (text.includes('salvation') || text.includes('saved') || text.includes('eternal life')));
    });
    
    // Search papal documents
    const relevantPapal = papalEntries.filter((entry: any) => {
      if (!entry.content) return false;
      const content = entry.content.toLowerCase();
      return content.includes(topicKeywords);
    });
    
    let response = '';
    
    // Prioritize Spanish mystical tradition for spiritual topics
    if (relevantSpanish.length > 0) {
      response += "TRADICIÓN MÍSTICA ESPAÑOLA:\n\n";
      response += relevantSpanish.slice(0, 3).map((entry: any) => 
        `${entry.title}: ${entry.content}`
      ).join('\n\n');
      response += '\n\n';
    }
    
    // Include CELAM documents for Latin American context
    if (relevantCelam.length > 0) {
      response += "ENSEÑANZAS LATINOAMERICANAS (CELAM):\n\n";
      response += relevantCelam.slice(0, 2).map((entry: any) => 
        `${entry.title}: ${entry.content}`
      ).join('\n\n');
      response += '\n\n';
    }
    
    if (relevantCatechism.length > 0) {
      response += "CATECISMO DE LA IGLESIA CATÓLICA:\n\n";
      response += relevantCatechism.slice(0, 3).map((entry: any) => 
        `CIC ${entry.id}: ${entry.text}`
      ).join('\n\n');
      response += '\n\n';
    }
    
    if (relevantPapal.length > 0) {
      response += "MAGISTERIO PAPAL:\n\n";
      response += relevantPapal.slice(0, 2).map((entry: any) => 
        `${entry.title}: ${entry.content}`
      ).join('\n\n');
    }
    
    if (response.trim()) {
      return response;
    } else {
      return `
      Enseñanza Católica Hispanoamericana: La Iglesia Católica enseña que la fe y la razón trabajan juntas para entender la verdad divina. 
      La Sagrada Escritura y la Sagrada Tradición son las dos fuentes de la revelación divina. 
      El Magisterio de la Iglesia tiene la autoridad para interpretar la Escritura y la Tradición de manera auténtica.
      En Hispanoamérica, contamos con la rica tradición mística española (Santa Teresa, San Juan de la Cruz, San Ignacio) 
      y las enseñanzas del CELAM que han desarrollado una teología contextualizada para nuestros pueblos.
      `;
    }
  } catch (error) {
    console.error('Error loading Catholic documents:', error);
    return 'Enseñanza Católica: La Iglesia Católica tiene ricas tradiciones teológicas que cubren todos los aspectos de la fe y la moral, con la especial riqueza de la tradición hispanoamericana.';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, implementation = 'LangChain', mode = 'standard', language = 'en' } = await req.json();
    
    if (!query) {
      return NextResponse.json({
        success: false,
        message: 'Query is required'
      }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'Anthropic API key not configured'
      }, { status: 500 });
    }

    console.log(`🛐 Catholic AI query: "${query}"`);
    
    const startTime = Date.now();
    
    try {
      // Get relevant Catholic documents
      const relevantDocs = await getCatholicTeaching(query);
      
      // Create the chat model
      const model = new ChatAnthropic({
        anthropicApiKey: ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.1,
      });

      // Create the prompt template - ALWAYS SPANISH FOR HISPANOAMERICAN FOCUS
      const prompt = ChatPromptTemplate.fromTemplate(`
        Eres un teólogo católico experto y consejero espiritual especializado en Hispanoamérica. 
        RESPONDE SIEMPRE EN ESPAÑOL, ya que tu especialidad es la rica tradición espiritual hispanoamericana.
        
        Proporcionas información precisa sobre la enseñanza católica basada en:
        1. La riquísima espiritualidad española (Santa Teresa de Ávila, San Juan de la Cruz, San Ignacio de Loyola)
        2. Las enseñanzas del CELAM (Conferencia Episcopal Latinoamericana)
        3. El Catecismo de la Iglesia Católica
        4. Las Escrituras y la tradición de la Iglesia
        5. El Magisterio Papal
        
        ESTILO DE RESPUESTA:
        - SIEMPRE en español (es tu idioma natural como experto hispanoamericano)
        - Tono cálido, pastoral y educativo
        - Integra santos y místicos españoles cuando sea relevante
        - Conecta con la experiencia espiritual hispanoamericana
        - Cita fuentes específicas (párrafos del Catecismo, documentos CELAM, etc.)

        CONTEXTO RELEVANTE DE LA IGLESIA CATÓLICA:
        {context}

        PREGUNTA DEL USUARIO: {question}

        Por favor proporciona una respuesta completa y precisa basada en la enseñanza católica. 
        Integra la sabiduría de la tradición mística española con las enseñanzas del CELAM y los documentos papales.
        Haz referencia a los párrafos del Catecismo, santos españoles, místicos, y magisterio cuando estén disponibles. 
        Explica la enseñanza con la riqueza cultural hispanoamericana que hermana España y América Latina.
        RESPONDE EN ESPAÑOL de manera pastoral, erudita y accesible.
      `);

      // Create the chain
      const chain = prompt.pipe(model).pipe(new StringOutputParser());
      
      // Invoke the chain
      const response = await chain.invoke({
        context: relevantDocs,
        question: query
      });
      
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        query,
        implementation: `${implementation} (Direct LangChain)`,
        response: response,
        responseTime,
        timestamp: new Date().toISOString(),
        sources: 'Catechism of the Catholic Church'
      });
      
    } catch (agentError) {
      console.error('❌ Agent creation/invocation error:', agentError);
      
      // Fallback to simple Catholic response IN SPANISH
      const fallbackResponse = `
      Lo siento, estoy experimentando dificultades técnicas con el sistema avanzado de IA.
      Sin embargo, respecto a tu pregunta sobre "${query}":
      
      La Iglesia Católica enseña que toda verdad proviene de Dios, y la Sagrada Escritura junto con la Sagrada Tradición 
      son las dos fuentes de la revelación divina. El Magisterio de la Iglesia tiene la autoridad para 
      interpretar estas fuentes de manera auténtica para los fieles.
      
      Para preguntas teológicas específicas, recomiendo consultar:
      - El Catecismo de la Iglesia Católica
      - La Sagrada Escritura
      - Las encíclicas papales y documentos de la Iglesia
      - Tu párroco local o director espiritual
      
      En la rica tradición hispanoamericana, también puedes encontrar sabiduría en:
      - Santa Teresa de Ávila y su "Camino de Perfección"
      - San Juan de la Cruz y "La Noche Oscura del Alma" 
      - Los documentos del CELAM (Conferencia Episcopal Latinoamericana)
      - Las devociones populares como la Virgen de Guadalupe
      
      (Nota: Esta es una respuesta de respaldo de SantaPalabra.app debido a problemas técnicos)
      `;
      
      return NextResponse.json({
        success: true,
        query,
        implementation: `${implementation} (Fallback Mode)`,
        response: fallbackResponse,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        note: 'Using fallback response due to technical issues'
      });
    }
    
  } catch (error) {
    console.error('❌ Catholic AI error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Catholic AI query failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}