# TheoAgent Enhanced Features

## ✅ Completed Features

### 1. Daily Gospel Reflection Integration
**Status**: ✅ Complete
**Implementation**: 
- Created `src/lib/dailyGospel.ts` for managing daily Gospel reflections
- Created `public/data/daily_gospel_reflections.json` with comprehensive reflections
- Integrated into RAG system via `dataInjection.ts`
- Triggers when users ask: "today's Gospel", "daily Gospel", "mass today", "liturgy"

**Features**:
- **Context**: Historical, literary, liturgical, and canonical context
- **Philology**: Greek term analysis with transliteration and insights
- **OT Connections**: Old Testament prophecies and typology
- **Traditional Interpretation**: Church Fathers quotes + modern exegesis + magisterial teaching
- **Scholars**: Insights from Ratzinger, Hahn, Wright, etc.
- **Personal Reflection**: 5 questions + prayer prompt
- **Practical Application**: Daily guidance

**Example Entry**: Luke 7:18b-23 (John the Baptist's question from prison)

**Usage**:
User: "What's today's Gospel?"
TheoAgent: [Returns full reflection with context, philology, OT connections, etc.]

---

### 2. Scripture Reference Auto-Linking
**Status**: ✅ Complete  
**Implementation**:
- Created `src/lib/scriptureLinks.ts` for reference detection and link generation
- Created `src/components/ScriptureLinkedMarkdown.tsx` for rendering
- Integrated into `page.tsx` replacing standard ReactMarkdown

**Features**:
- **Auto-detection**: Recognizes patterns like "John 3:16", "Mt 5:3-12", "Genesis 1:1-2:3"
- **Multi-language Support**: Greek, Latin, English, Spanish, Italian, French, German, Portuguese
- **Intelligent Book Name Matching**: Handles abbreviations and variations
- **Language Auto-detection**: Detects language from text and selects appropriate Bible version
- **Bible Gateway Integration**: Links to correct version (NABRE for English, RVR1995 for Spanish, etc.)
- **USCCB Bible Support**: Alternative to Bible Gateway for English
- **Custom Styling**: Blue dotted underline for scripture links, distinct from regular links

**Supported Formats**:
- Full names: "Matthew 5:3"
- Abbreviations: "Mt 5:3", "Jn 3:16"
- Ranges: "Genesis 1:1-2:3", "Luke 4:14-30"
- Chapter only: "Psalm 23"
- Numbered books: "1 Corinthians 13", "2 Peter 3:8"

**Bible Versions by Language**:
- English: NABRE (New American Bible Revised Edition - Catholic)
- Spanish: RVR1995 (Reina Valera 1995)
- Italian: CEI (Conferenza Episcopale Italiana)
- French: BDS (Bible du Semeur)
- German: LUT (Luther Bible)
- Portuguese: ARC (Almeida Revista e Corrigida)
- Latin: VULGATE
- Greek: TR (Textus Receptus)

---

## 🚧 In Progress Features

### 3. Voice Input/Output (ElevenLabs Integration)
**Status**: 🚧 Planning
**Priority**: HIGH
**Implementation Plan**:

#### Phase 1: Voice Output (Text-to-Speech)
1. **Setup ElevenLabs API**:
   - Add `ELEVENLABS_API_KEY` to environment variables
   - Create `src/lib/voice.ts` for ElevenLabs integration
   
2. **Audio Player Component**:
   - Add audio player UI element below each assistant message
   - "Listen" button triggers TTS
   - Streaming audio playback
   
3. **Voice Selection**:
   - Choose appropriate voice (male, scholarly, warm)
   - Consider: "Matthew" or "George" voices for Biblical scholar tone
   - Settings panel for voice customization

#### Phase 2: Voice Input (Speech-to-Text)
1. **Web Speech API** (Browser-native, free):
   - Add microphone button in input area
   - Real-time transcription
   - Multi-language support
   - Fallback for unsupported browsers

2. **Alternative: ElevenLabs STT**:
   - Higher accuracy for theology-specific terms
   - Better multilingual support
   - Requires additional API calls

#### Phase 3: Voice Conversation Mode
1. **Continuous Mode**: 
   - Hold space bar to speak
   - Auto-submit on release
   - Auto-play response audio
   
2. **Hands-free Mode**:
   - Wake word activation: "TheoAgent"
   - Continuous listening with visual feedback

**Technical Requirements**:
- ElevenLabs Basic Plan: $5/month (30,000 characters/month)
- Voice Models: Eleven Multilingual v2
- Latency optimization: stream audio chunks
- Mobile compatibility: test on iOS/Android

**User Experience**:
- 🎤 Microphone icon in input field
- 🔊 Speaker icon below each message
- Visual waveform during recording/playback
- Language auto-detection from voice input

---

### 4. Quiz/Study Mode with Roadmaps
**Status**: 🚧 Planning
**Priority**: MEDIUM
**Implementation Plan**:

#### Roadmap 1: New Testament Structure
**Goal**: Understand NT as a coherent story

**Modules**:
1. **Synoptic Gospels** (4 weeks)
   - Week 1: Mark's Gospel (earliest, action-focused)
   - Week 2: Matthew's Gospel (Jewish audience, fulfillment)
   - Week 3: Luke's Gospel (Gentile audience, mercy)
   - Week 4: Synoptic Comparison (why 3 similar Gospels?)
   - Quiz: Identify Gospel by passage characteristics

2. **John's Gospel** (2 weeks)
   - Week 5: Seven Signs in John
   - Week 6: "I AM" statements and theology
   - Quiz: Johannine theology themes

3. **Acts & Early Church** (2 weeks)
   - Week 7: Pentecost to Paul's conversion
   - Week 8: Paul's missionary journeys
   - Quiz: Early Church history

4. **Paul's Letters** (4 weeks)
   - Week 9: Romans & Galatians (justification, law)
   - Week 10: Corinthians (church life, resurrection)
   - Week 11: Prison Epistles (Ephesians, Philippians, Colossians)
   - Week 12: Pastoral Epistles (Timothy, Titus)
   - Quiz: Pauline theology concepts

5. **Catholic Epistles & Revelation** (2 weeks)
   - Week 13: Hebrews, James, Peter, Jude
   - Week 14: Revelation (apocalyptic literature)
   - Final Quiz: Complete NT comprehension

#### Roadmap 2: Old Testament Structure
**Goal**: Understand salvation history

**Modules**:
1. **Pentateuch** (5 weeks)
   - Creation & Patriarchs (Genesis)
   - Exodus & Sinai Covenant
   - Levitical Law & Worship
   - Wilderness Wanderings
   - Deuteronomy & Torah Summary

2. **Historical Books** (4 weeks)
   - Conquest & Judges
   - United Monarchy (Saul, David, Solomon)
   - Divided Kingdom
   - Exile & Return

3. **Wisdom Literature** (3 weeks)
   - Job (suffering)
   - Psalms (prayer)
   - Proverbs, Ecclesiastes, Song of Songs

4. **Prophets** (4 weeks)
   - Major Prophets (Isaiah, Jeremiah, Ezekiel, Daniel)
   - Minor Prophets
   - Messianic prophecies
   - Prophetic themes

#### Roadmap 3: Bible in a Year
**Goal**: Read entire Bible in 365 days (Catholic canon)

**Structure**:
- Daily readings (OT + Psalm + NT)
- Following liturgical calendar
- Daily reflection questions
- Weekly review quizzes
- Progress tracking dashboard

**Integration**:
- Use daily Gospel reflections
- Add OT and Epistle reflections
- Thematic connections (typology)
- Saints' feast days commentary

#### Roadmap 4: Catholic Theology Topics
**Goal**: Systematic theology education

**Modules**:
1. **Christology** (4 weeks)
   - Person of Christ (hypostatic union)
   - Work of Christ (redemption)
   - Christ in Scripture (typology)
   - Councils (Nicaea, Chalcedon)

2. **Mariology** (2 weeks)
   - Mary in Scripture
   - Marian dogmas (Immaculate Conception, Assumption)
   - Mary in Tradition (Fathers, saints)

3. **Sacramental Theology** (4 weeks)
   - Eucharist (Real Presence, sacrifice)
   - Baptism & Confirmation
   - Reconciliation & Anointing
   - Marriage & Holy Orders

4. **Ecclesiology** (2 weeks)
   - Church in Scripture (Body of Christ, Bride)
   - Church structure (Peter, apostles, bishops)
   - Marks of Church (one, holy, catholic, apostolic)

5. **Eschatology** (2 weeks)
   - Death & Particular Judgment
   - Purgatory, Heaven, Hell
   - Second Coming & General Judgment
   - Resurrection of the body

**Quiz Types**:
1. **Multiple Choice**: Test knowledge recall
2. **True/False**: Doctrine accuracy
3. **Short Answer**: Explain concepts
4. **Matching**: Connect passages to themes
5. **Scripture Identification**: Book, chapter, verse
6. **Reflection Questions**: Personal application

**Progress Tracking**:
- Completion percentage per roadmap
- Quiz scores history
- Badges/achievements
- Certificates of completion
- Study streak counter

**Data Structure** (to create):
```typescript
interface Roadmap {
  id: string;
  title: string;
  description: string;
  duration: string; // "12 weeks", "365 days"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: Module[];
}

interface Module {
  id: string;
  week: number;
  title: string;
  readings: Reading[];
  learningObjectives: string[];
  quiz: Quiz;
}

interface Reading {
  reference: string;
  text: string;
  commentary: string;
  reflection_questions: string[];
}

interface Quiz {
  id: string;
  questions: Question[];
  passingScore: number;
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
  scriptureReference?: string;
}

interface UserProgress {
  userId: string;
  roadmapId: string;
  currentModule: number;
  completedModules: number[];
  quizScores: Record<string, number>;
  startedDate: string;
  completionDate?: string;
}
```

---

## 📋 Backlog Features

### 5. Advanced Search in Knowledge Base
- Full-text search across all data files
- Filter by difficulty, tags, scholar
- Search history

### 6. Bookmark/Favorites System
- Save favorite responses
- Create personal notes
- Export conversation history

### 7. Multi-turn Dialogue Context
- Remember conversation context better
- Track discussion themes
- Suggest related topics

### 8. Daily Notifications
- Push notification for daily Gospel
- Reminder for study roadmap progress
- Feast day notifications

### 9. Mobile App
- React Native version
- Offline mode with cached data
- Voice-first interface

### 10. Community Features
- Share reflections
- Discussion forums
- Prayer requests

---

## 🔧 Technical Architecture

### Current Stack
- **Frontend**: Next.js 16.0.10, React 19.2.1, Tailwind CSS
- **AI**: Anthropic Claude Sonnet 4 via AI SDK 5.0.115
- **Deployment**: Vercel
- **Knowledge Base**: JSON files + RAG (context injection)

### Planned Additions
- **Voice**: ElevenLabs API
- **Database**: PostgreSQL or Firebase (for user progress tracking)
- **Authentication**: NextAuth.js with Google/email
- **Storage**: Vercel Blob Storage (for audio files)

### Performance Considerations
- Edge functions for low latency
- CDN for audio files
- Lazy loading for roadmap modules
- Caching for frequently accessed data

---

## 🎯 Next Steps

### Immediate (This Week)
1. ✅ Deploy daily Gospel feature to production
2. ✅ Deploy scripture auto-linking to production
3. 🚧 Add 7 more daily Gospel reflections (target: 30 total)
4. 🚧 Implement ElevenLabs voice output

### Short-term (Next 2 Weeks)
1. Complete voice input (speech-to-text)
2. Create database schema for quiz/roadmap system
3. Build first roadmap module (NT Week 1: Mark's Gospel)
4. Test voice features on mobile

### Medium-term (Next Month)
1. Complete all 4 roadmaps (structure + first 3 modules each)
2. Implement user authentication
3. Build progress tracking dashboard
4. Beta test with 10 users

### Long-term (Next 3 Months)
1. Full quiz system with 200+ questions
2. Complete all roadmap modules
3. Mobile app MVP
4. Community features launch

---

## 📊 Metrics & Success Criteria

### User Engagement
- Daily active users
- Average session duration
- Messages per session
- Feature adoption rate (voice, quiz, daily Gospel)

### Learning Outcomes
- Quiz completion rates
- Average quiz scores
- Roadmap completion rates
- User feedback scores

### Technical Performance
- Response time < 1s
- Voice latency < 2s
- Uptime > 99.5%
- Error rate < 0.1%

---

## 💡 User Feedback Integration

### Beta Testing Priorities
1. Voice quality & accuracy
2. Scripture auto-linking accuracy (multi-language)
3. Daily Gospel usefulness
4. Quiz difficulty calibration
5. UI/UX for roadmaps

### Feedback Channels
- In-app feedback button
- Email: feedback@theoagent.com
- Discord community
- Monthly surveys

---

## 🚀 Launch Timeline

**Phase 1 (Current)**: Core Features
- ✅ Chat interface
- ✅ RAG system
- ✅ Daily Gospel
- ✅ Scripture linking

**Phase 2 (Week 2)**: Voice Integration
- 🎤 Voice input
- 🔊 Voice output
- 🗣️ Conversation mode

**Phase 3 (Month 1)**: Learning Platform
- 📚 First roadmap
- ✅ Quiz system
- 📊 Progress tracking

**Phase 4 (Month 2)**: Complete Platform
- 📱 Mobile app
- 👥 Community features
- 🔔 Notifications

**Phase 5 (Month 3)**: Scale & Optimize
- 🌍 Multi-language expansion
- 🎓 Partner with Catholic schools
- 📈 Marketing launch

---

*Last Updated: December 2025*
*Version: 2.0.0-beta*
