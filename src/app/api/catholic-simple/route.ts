import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type CatechismEntry = {
  id: string | number;
  text: string;
};

type PapalPassage = {
  paragraph: string | number;
  text: string;
  theme: string;
};

type PapalDocument = {
  title: string;
  pope: string;
  year: string | number;
  key_passages?: PapalPassage[];
};

type DeiVerbumPassage = {
  paragraph: string | number;
  title: string;
  text: string;
  theme?: string;
};

type GospelReflection = {
  gospel_text?: string;
  liturgical_day?: string;
  gospel_citation?: string;
};

// Function to retrieve Catholic documents from multiple sources
async function getCatholicTeaching(topic: string): Promise<{ catechism: string, papal: string, deiVerbum: string, gospels: string, sources: string[] }> {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'data');
    let catechismContent = '';
    let papalContent = '';
    let deiVerbumContent = '';
    let gospelsContent = '';
    const sources: string[] = [];
    
    // Load Catechism data
    try {
      const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
      const catechismEntries = JSON.parse(catechismData) as CatechismEntry[];
      
      const relevantCatechism = catechismEntries.filter((entry) => {
        if (!entry.text) return false;
        const text = entry.text.toLowerCase();
        const topicKeywords = topic.toLowerCase();
        
        return text.includes(topicKeywords) ||
               (topicKeywords.includes('trinity') && (text.includes('father') || text.includes('son') || text.includes('holy spirit') || text.includes('trinity') || text.includes('three persons'))) ||
               (topicKeywords.includes('prayer') && (text.includes('prayer') || text.includes('pray') || text.includes('worship') || text.includes('lord\'s prayer'))) ||
               (topicKeywords.includes('mary') && (text.includes('mary') || text.includes('virgin') || text.includes('mother'))) ||
               (topicKeywords.includes('eucharist') && (text.includes('eucharist') || text.includes('communion') || text.includes('mass') || text.includes('bread') || text.includes('wine'))) ||
               (topicKeywords.includes('salvation') && (text.includes('salvation') || text.includes('saved') || text.includes('eternal life') || text.includes('grace'))) ||
               (topicKeywords.includes('love') && (text.includes('love') || text.includes('charity') || text.includes('heart'))) ||
               (topicKeywords.includes('revelation') && (text.includes('revelation') || text.includes('scripture') || text.includes('tradition')));
      });
      
      if (relevantCatechism.length > 0) {
        catechismContent = relevantCatechism
          .slice(0, 3)
          .map((entry) => `**CCC ${entry.id}**: ${entry.text}`)
          .join('\n\n');
        sources.push('Catechism of the Catholic Church');
      }
    } catch {
      console.log('Catechism not available');
    }

    // Load Papal Magisterium
    try {
      const papalData = await fs.readFile(path.join(publicDir, 'papal_magisterium.json'), 'utf-8');
      const papalDocs = JSON.parse(papalData) as {
        papal_documents?: PapalDocument[];
      };
      
      const relevantPapal: {
        document: string;
        pope: string;
        year: string | number;
        paragraph: string | number;
        text: string;
        theme: string;
      }[] = [];

      for (const doc of papalDocs.papal_documents || []) {
        if (doc.key_passages) {
          for (const passage of doc.key_passages) {
            const text = passage.text.toLowerCase();
            const theme = passage.theme.toLowerCase();
            const topicKeywords = topic.toLowerCase();
            
            if (text.includes(topicKeywords) || theme.includes(topicKeywords) ||
                (topicKeywords.includes('love') && (text.includes('love') || text.includes('heart') || theme.includes('love'))) ||
                (topicKeywords.includes('prayer') && (text.includes('prayer') || theme.includes('prayer'))) ||
                (topicKeywords.includes('eucharist') && (text.includes('eucharist') || text.includes('sacrament'))) ||
                (topicKeywords.includes('trinity') && (text.includes('father') || text.includes('son') || text.includes('spirit'))) ||
                (topicKeywords.includes('salvation') && (text.includes('salvation') || text.includes('redemption')))) {
              relevantPapal.push({
                document: doc.title,
                pope: doc.pope,
                year: doc.year,
                paragraph: passage.paragraph,
                text: passage.text,
                theme: passage.theme
              });
            }
          }
        }
      }
      
      if (relevantPapal.length > 0) {
        papalContent = relevantPapal
          .slice(0, 2)
          .map(
            (p) =>
              `**${p.document}** (${p.pope}, ${p.year}), §${p.paragraph}: ${p.text}`,
          )
          .join('\n\n');
        sources.push('Papal Magisterium');
      }
    } catch {
      console.log('Papal documents not available');
    }

    // Load Dei Verbum passages
    try {
      const deiVerbumData = await fs.readFile(path.join(publicDir, 'dei_verbum_passages.json'), 'utf-8');
      const deiVerbumPassages = JSON.parse(deiVerbumData) as DeiVerbumPassage[];
      
      const relevantDeiVerbum = deiVerbumPassages.filter((passage) => {
        const text = passage.text.toLowerCase();
        const theme = passage.theme?.toLowerCase() || '';
        const topicKeywords = topic.toLowerCase();
        
        return text.includes(topicKeywords) || theme.includes(topicKeywords) ||
               (topicKeywords.includes('revelation') && (text.includes('revelation') || text.includes('scripture') || text.includes('tradition'))) ||
               (topicKeywords.includes('scripture') && (text.includes('scripture') || text.includes('word'))) ||
               (topicKeywords.includes('tradition') && (text.includes('tradition') || text.includes('apostolic'))) ||
               (topicKeywords.includes('trinity') && (text.includes('father') || text.includes('christ') || text.includes('spirit')));
      });
      
      if (relevantDeiVerbum.length > 0) {
        deiVerbumContent = relevantDeiVerbum
          .slice(0, 2)
          .map(
            (passage) =>
              `**Dei Verbum §${passage.paragraph}** (${passage.title}): ${passage.text}`,
          )
          .join('\n\n');
        sources.push('Dei Verbum (Vatican II)');
      }
    } catch {
      console.log('Dei Verbum not available');
    }

    // Load Gospel reflections
    try {
      const gospelData = await fs.readFile(path.join(publicDir, 'daily_gospel_reflections.json'), 'utf-8');
      const gospelReflections = JSON.parse(gospelData) as GospelReflection[];
      
      const relevantGospels = gospelReflections.filter((reflection) => {
        const gospel = reflection.gospel_text?.toLowerCase() || '';
        const liturgical = reflection.liturgical_day?.toLowerCase() || '';
        const topicKeywords = topic.toLowerCase();
        
        return gospel.includes(topicKeywords) || liturgical.includes(topicKeywords) ||
               (topicKeywords.includes('jesus') && gospel.includes('jesus')) ||
               (topicKeywords.includes('prayer') && gospel.includes('pray')) ||
               (topicKeywords.includes('love') && gospel.includes('love')) ||
               (topicKeywords.includes('salvation') && (gospel.includes('save') || gospel.includes('eternal')));
      });
      
      if (relevantGospels.length > 0) {
        gospelsContent = relevantGospels
          .slice(0, 1)
          .map((ref) => {
            const gospelText = ref.gospel_text || '';
            return `**Gospel: ${ref.gospel_citation}** (${ref.liturgical_day}): ${gospelText.substring(0, 300)}...`;
          })
          .join('\n\n');
        sources.push('Daily Gospel Reflections');
      }
    } catch {
      console.log('Gospel reflections not available');
    }
    
    return {
      catechism: catechismContent,
      papal: papalContent,
      deiVerbum: deiVerbumContent,
      gospels: gospelsContent,
      sources
    };
  } catch (error: unknown) {
    console.error('Error loading Catholic documents:', error);
    return { catechism: '', papal: '', deiVerbum: '', gospels: '', sources: [] };
  }
}

// Comprehensive Catholic responses for common topics
function getCatholicResponse(query: string, documents: { catechism: string, papal: string, deiVerbum: string, gospels: string, sources: string[] }): string {
  const lowerQuery = query.toLowerCase();
  const { catechism, papal, deiVerbum, gospels } = documents;
  
  // Helper function to format sources section
  const formatSources = () => {
    let sourcesSection = '';
    if (catechism) sourcesSection += `\n### From the Catechism:\n${catechism}\n`;
    if (papal) sourcesSection += `\n### From Papal Teaching:\n${papal}\n`;
    if (deiVerbum) sourcesSection += `\n### From Vatican II (Dei Verbum):\n${deiVerbum}\n`;
    if (gospels) sourcesSection += `\n### From Scripture:\n${gospels}\n`;
    return sourcesSection;
  };
  
  if (lowerQuery.includes('trinity')) {
    return `## Catholic Teaching on the Trinity

The Catholic Church teaches that the Trinity is the central mystery of the Christian faith and life. It is the mystery of God in himself. The Trinity consists of three distinct Persons who are one God:

### The Three Persons:
- **God the Father**: The first Person of the Trinity, who is the source of all creation
- **God the Son (Jesus Christ)**: The second Person, who became incarnate for our salvation
- **God the Holy Spirit**: The third Person, who sanctifies and gives life to the Church

### Key Catholic Doctrine:
- The three Persons are co-equal and co-eternal
- Each Person is fully God, yet there is only one God
- The Persons are distinguished by their relationships to one another
- This mystery was revealed through Scripture and is affirmed by Church councils

### Scripture Foundation:
The Trinity is revealed in Scripture, such as in the baptismal formula: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit" (Matthew 28:19).

### From Catholic Teaching:
${formatSources() || 'The Trinity is the central mystery of Christian faith and life, as taught in CCC 232-267.'}

The doctrine of the Trinity shows us that God is not a solitary being, but rather exists in perfect communion of love.`;
  }
  
  if (lowerQuery.includes('prayer')) {
    return `## Catholic Teaching on Prayer

Prayer is fundamental to Catholic life and is defined as "the raising of one's mind and heart to God." The Catholic Church teaches several essential aspects about prayer:

### What is Prayer?
- **Conversation with God**: Prayer is a dialogue between the human person and God
- **Relationship**: It deepens our relationship with the Father, Son, and Holy Spirit
- **Multiple Forms**: Including vocal prayer, meditation, and contemplation

### Types of Catholic Prayer:
1. **Adoration**: Acknowledging God's greatness and majesty
2. **Contrition**: Asking for forgiveness for our sins
3. **Thanksgiving**: Expressing gratitude for God's gifts
4. **Supplication**: Asking for God's help and blessings

### The Lord's Prayer:
Jesus taught us the perfect prayer in the Our Father (Matthew 6:9-13), which serves as the model for all Christian prayer.

### How Catholics Should Pray:
- **Regularly**: Daily prayer is essential for spiritual growth
- **Reverently**: With proper respect and attention
- **Persistently**: Not giving up even when prayers seem unanswered
- **In Union with Christ**: Through Jesus, our mediator

### From Catholic Teaching:
${formatSources() || 'Prayer is treated extensively in CCC 2558-2865, emphasizing its necessity for spiritual life.'}

The Church encourages both private prayer and liturgical prayer, especially participation in the Mass.`;
  }
  
  if (lowerQuery.includes('eucharist')) {
    return `## Catholic Teaching on the Eucharist

The Eucharist is the "source and summit" of Catholic life, representing the true Body and Blood of Jesus Christ under the appearances of bread and wine.

### What is the Eucharist?
- **Real Presence**: Catholics believe Jesus is truly, really, and substantially present
- **Sacrifice**: The Eucharist re-presents (makes present again) Christ's sacrifice on Calvary
- **Communion**: It unites us with Christ and with one another

### Key Catholic Beliefs:
1. **Transubstantiation**: The bread and wine become the actual Body and Blood of Christ
2. **Perpetual Sacrifice**: Each Mass makes present the one sacrifice of Christ
3. **Spiritual Nourishment**: The Eucharist feeds our souls and strengthens us for Christian living

### Requirements for Reception:
- Be in a state of grace (free from mortal sin)
- Believe in the Real Presence
- Fast for one hour before receiving (except water and medicine)
- Be Catholic or in full communion with the Church

### From Catholic Teaching:
${formatSources() || 'The Eucharist is extensively covered in CCC 1322-1419, explaining its central role in Catholic worship.'}

The Church teaches that the Eucharist is both a sacrifice and a sacrament, the memorial of Christ's Passover.`;
  }
  
  if (lowerQuery.includes('mary')) {
    return `## Catholic Teaching on Mary, Mother of God

The Catholic Church holds Mary, the Mother of Jesus, in special veneration as the Mother of God and our spiritual mother.

### Mary's Titles and Role:
- **Theotokos (Mother of God)**: Declared at the Council of Ephesus (431 AD)
- **Ever-Virgin**: Mary remained a virgin before, during, and after Jesus' birth
- **Immaculate Conception**: Mary was conceived without original sin
- **Assumption**: Mary was taken body and soul into heaven

### Catholic Devotion to Mary:
1. **Veneration, not Worship**: Catholics honor Mary but worship God alone
2. **Intercession**: We ask Mary to pray for us, as she intercedes with her Son
3. **Model of Faith**: Mary exemplifies perfect discipleship and trust in God
4. **Mother of the Church**: She is our spiritual mother who cares for all believers

### The Rosary and Marian Prayer:
- The Rosary is a cherished Catholic prayer focusing on the mysteries of Christ's life
- The Hail Mary is based on Scripture (Luke 1:28, 42)
- Marian devotion leads us closer to Jesus

### From Catholic Teaching:
${formatSources() || 'Mary\'s role is explained in CCC 484-511 and 963-975, showing her unique place in salvation history.'}

All Marian doctrine and devotion is ultimately Christocentric - it leads us to Christ.`;
  }
  
  if (lowerQuery.includes('salvation')) {
    return `## Catholic Teaching on Salvation

The Catholic Church teaches that salvation comes from God's grace through Jesus Christ, requiring both faith and cooperation with divine grace.

### How Salvation Works:
- **Grace**: Salvation is a free gift from God, not earned by human works
- **Faith**: We must believe in Jesus Christ as Lord and Savior  
- **Cooperation**: We must cooperate with God's grace through good works
- **Sacraments**: God's grace is communicated through the sacraments, especially Baptism

### Key Catholic Principles:
1. **Christ Alone**: Jesus is the sole mediator between God and humanity
2. **Grace and Works**: Both faith and good works are necessary (not either/or)
3. **Universal Call**: God desires all people to be saved
4. **Perseverance**: We must remain in God's grace throughout our lives

### The Process of Salvation:
- **Justification**: Being made right with God through Baptism
- **Sanctification**: Growing in holiness through the Christian life
- **Glorification**: Final salvation in heaven

### From Catholic Teaching:
${formatSources() || 'Salvation is comprehensively addressed in CCC 1987-2029, explaining the Catholic understanding of justification and grace.'}

The Catholic Church teaches that while salvation is assured through Christ, we must persevere in faith and grace until the end of our lives.`;
  }
  
  if (lowerQuery.includes('love') || lowerQuery.includes('heart') || lowerQuery.includes('sacred heart')) {
    return `## Catholic Teaching on Divine Love and the Sacred Heart

The Catholic Church teaches that God's love is the foundation of all Christian life and that devotion to the Sacred Heart of Jesus reveals this love most perfectly.

### The Nature of God's Love:
- **Personal**: God loves each individual person with infinite, personal love
- **Sacrificial**: Demonstrated supremely in Christ's passion and death
- **Transformative**: God's love changes hearts and enables us to love others
- **Eternal**: This love extends beyond death into eternal life

### The Sacred Heart Devotion:
- **Central Mystery**: The pierced heart of Jesus symbolizes God's boundless love
- **Sacramental Connection**: From Christ's heart flow the sacraments of the Church
- **Personal Relationship**: Encourages intimate, personal love for Jesus
- **Reparation**: We are called to console the Sacred Heart through our love

### How We Respond to God's Love:
1. **Love God**: With all our heart, soul, mind, and strength
2. **Love Neighbor**: As ourselves, especially the poor and suffering
3. **Sacramental Life**: Receiving grace through the sacraments
4. **Prayer and Devotion**: Especially to the Sacred Heart of Jesus

### From Catholic Teaching:
${formatSources() || 'The Sacred Heart devotion and God\'s love are central themes in Catholic spirituality and papal teaching.'}

The love of God revealed in the Sacred Heart of Jesus is not just a doctrine to be believed, but a love to be experienced and shared with others.`;
  }
  
  // Default response for other topics
  return `## Catholic Teaching Response

Thank you for your question about "${query}". The Catholic Church has rich teaching on this topic.

### From Catholic Teaching:
${formatSources() || 'The Catholic Church draws its teaching from Sacred Scripture, Sacred Tradition, and the Magisterium.'}

### General Catholic Principles:
- All Catholic teaching is rooted in Sacred Scripture and Sacred Tradition
- The Magisterium of the Church provides authoritative interpretation
- Catholic doctrine develops over time while remaining faithful to apostolic teaching
- Faith and reason work together to understand divine truth

For more detailed information on this topic, I recommend:
- **The Catechism of the Catholic Church** - The official compendium of Catholic doctrine
- **Sacred Scripture** - The inspired Word of God
- **Papal encyclicals** - Official Church teaching documents
- **Your local priest or spiritual director** - For personal guidance

Would you like me to explore any specific aspect of Catholic teaching on this topic?`;
}

export async function POST(req: NextRequest) {
  try {
    const { query, implementation = 'Catholic Simple', mode = 'standard', language = 'en' } = await req.json();
    
    if (!query) {
      return NextResponse.json({
        success: false,
        message: 'Query is required'
      }, { status: 400 });
    }

    console.log(`🛐 Catholic Simple query: "${query}"`);
    
    const startTime = Date.now();
    
    // Get relevant Catholic documents from multiple sources
    const relevantDocs = await getCatholicTeaching(query);
    
    // Generate comprehensive Catholic response
    const response = getCatholicResponse(query, relevantDocs);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      query,
      implementation: `${implementation} (Enhanced Multi-Source)`,
      response: response,
      responseTime,
      timestamp: new Date().toISOString(),
      sources: relevantDocs.sources.length > 0 ? relevantDocs.sources.join(', ') : 'Catholic Doctrine'
    });
    
  } catch (error) {
    console.error('❌ Catholic Simple error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Catholic Simple query failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
