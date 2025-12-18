# Quick Guide: Adding Your Own Data to TheoAgent

## ✅ What I've Set Up For You

### 1. Enhanced System Prompt
- **File:** `src/app/api/chat/route.ts`
- **What Changed:** Detailed instructions for TheoAgent's personality, knowledge areas, and response formatting
- **Result:** Better, more structured theological responses with proper citations

### 2. Data Infrastructure
Created files for custom data injection:
- `src/lib/dataInjection.ts` - Functions to search and inject your data
- `public/data/custom_teachings.json` - Template for adding your own content
- `src/app/api/chat/route_with_context.ts.example` - Example API route with context injection

### 3. Documentation
- `TRAINING_GUIDE.md` - Complete guide with all methods
- This quick reference

---

## 🚀 Quick Start: 3 Ways to Customize

### Method 1: System Prompt Only (5 minutes)
**Best for:** General behavior, tone, and style

**Steps:**
1. Open `src/app/api/chat/route.ts`
2. Find the `system:` parameter (line ~15)
3. Modify the text to add your instructions
4. Save and test!

**Example additions:**
```typescript
system: `You are TheoAgent...

Additional expertise:
- You specialize in [your topic]
- You always mention [specific teaching]
- You respond in a [formal/casual/pastoral] tone

Special instructions:
- Always cite Scripture using [your preferred translation]
- Include a prayer at the end of responses about [topic]
- Emphasize [specific aspect] when discussing [subject]
`
```

### Method 2: Add Custom Data Files (15 minutes)
**Best for:** Adding specific facts, teachings, or reference material

**Steps:**
1. Create a JSON file in `public/data/` (e.g., `saints.json`, `prayers.json`)
2. Structure your data:
```json
[
  {
    "id": "unique-id",
    "title": "Topic Title",
    "content": "Your content here...",
    "source": "Source citation",
    "tags": ["tag1", "tag2"]
  }
]
```
3. Update `src/lib/dataInjection.ts` to include your new file
4. Copy `route_with_context.ts.example` to replace `route.ts`
5. Test!

### Method 3: Automatic Context Injection (30 minutes)
**Best for:** Dynamic, relevant context from large datasets

**Already set up! Just activate:**
1. Review `public/data/custom_teachings.json` - add your own teachings
2. Backup your current `route.ts`
3. Copy contents from `route_with_context.ts.example` to `route.ts`
4. Test by asking about topics in your data

---

## 📝 Adding Different Types of Content

### Saints & Biographies
```json
{
  "name": "Saint [Name]",
  "feast_day": "Month Day",
  "born": "year",
  "died": "year",
  "biography": "Short life story...",
  "patronage": ["what they're patron of"],
  "famous_quotes": ["quote 1", "quote 2"],
  "miracles": ["miracle 1"]
}
```

### Prayers
```json
{
  "name": "Prayer Name",
  "text": "Full prayer text...",
  "occasion": "When to pray this",
  "tradition": "Dominican/Jesuit/etc",
  "tags": ["morning", "evening", "marian"]
}
```

### Church Documents
```json
{
  "title": "Document Name",
  "type": "Encyclical/Constitution/etc",
  "pope": "Pope Name",
  "year": 1965,
  "summary": "Brief overview...",
  "key_excerpts": [
    {
      "paragraph": 12,
      "text": "excerpt..."
    }
  ],
  "themes": ["theme1", "theme2"]
}
```

### Liturgical Calendar
```json
{
  "date": "2025-12-25",
  "celebration": "Christmas",
  "rank": "Solemnity",
  "color": "White",
  "readings": {
    "first": "Isaiah 9:1-6",
    "psalm": "Psalm 96",
    "second": "Titus 2:11-14",
    "gospel": "Luke 2:1-14"
  }
}
```

---

## 🎯 Recommended Immediate Actions

### For Better Responses Right Now:
1. **Edit the system prompt** in `route.ts` with specific instructions about:
   - Your preferred citation style
   - Topics to emphasize
   - Tone (formal vs conversational)
   - Length of responses

### For Custom Content:
1. **Add 5-10 entries** to `custom_teachings.json` about topics you want TheoAgent to know well
2. **Enable context injection** by using the example route
3. **Test thoroughly** with questions about your added content

### For Long-term Growth:
1. **Collect content** from reliable Catholic sources
2. **Structure as JSON** using the templates above
3. **Add gradually** and test each addition
4. **Document sources** for credibility

---

## 📚 Where to Get Quality Catholic Content

### Official Sources:
- **Vatican.va** - Catechism, encyclicals, documents
- **USCCB.org** - Liturgical calendar, daily readings
- **Scborromeo.org** - Catechism searchable database

### Reference Works:
- **New Advent** - Catholic Encyclopedia, Church Fathers
- **Butler's Lives of the Saints**
- **Summa Theologica** - St. Thomas Aquinas

### Modern Resources:
- **Catholic Answers** - Apologetics, common questions
- **Word on Fire** - Bishop Barron's teachings
- **EWTN** - Various resources

---

## ⚠️ Important Reminders

1. **Verify Accuracy:** Always check theological content against authoritative sources
2. **Cite Sources:** Include references in your JSON data
3. **Test Thoroughly:** Ask challenging questions to verify responses
4. **Iterate:** Start small, add gradually, refine based on results
5. **Backup:** Keep copies before making major changes

---

## 🆘 Troubleshooting

**Q: Changes to system prompt not appearing?**
- Clear browser cache
- Restart the dev server
- Check for syntax errors in route.ts

**Q: Custom data not being used?**
- Verify JSON file is valid (use jsonlint.com)
- Check file paths are correct
- Ensure context injection is enabled in route.ts

**Q: Responses are too long/short?**
- Add length guidelines to system prompt
- Adjust the amount of context injected
- Be more specific in your question

---

## 📈 Next Steps

1. ✅ System prompt is already enhanced
2. ⏭️ Add your first custom teachings to `custom_teachings.json`
3. ⏭️ Enable context injection when ready
4. ⏭️ Gradually build your knowledge base
5. ⏭️ Consider vector search for larger datasets (see TRAINING_GUIDE.md)

**Need help?** Check TRAINING_GUIDE.md for detailed explanations of each method!
