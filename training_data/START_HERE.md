# 🎯 START HERE: Your First 10 Q&A Pairs

This file will guide you through creating your first batch of training data.

## Instructions:

1. **Copy the template structure** from TEMPLATE.jsonl
2. **Choose 10 questions** from the topic list below
3. **Research answers** using CCC, Vatican documents, Scripture
4. **Format each Q&A** following the exact template structure
5. **Save to** `collected_data/batch_01.jsonl`
6. **Validate** using: `python validate_training_data.py collected_data/batch_01.jsonl`

---

## 📝 Suggested First 10 Questions (Starter Topics):

### Doctrinal Theology (4 questions):
1. **What is the Holy Trinity?**
   - Context: User wants basic explanation of fundamental doctrine
   - Key sources: CCC 232-267, Athanasian Creed, Nicene Creed
   
2. **What does it mean that Jesus is fully God and fully human?**
   - Context: User is confused about the Incarnation
   - Key sources: CCC 464-469, Council of Chalcedon, John 1:14
   
3. **Why do Catholics call Mary "Mother of God"?**
   - Context: Protestant friend questioned this title
   - Key sources: CCC 495, 509, Council of Ephesus, Luke 1:43
   
4. **What is the Catholic Church's role in salvation?**
   - Context: User heard "no salvation outside the Church" and is confused
   - Key sources: CCC 846-848, Lumen Gentium 14-16

### Moral Theology (2 questions):
5. **How do Catholics determine if something is morally right or wrong?**
   - Context: User wants to understand Catholic moral framework
   - Key sources: CCC 1749-1761 (sources of morality), Veritatis Splendor
   
6. **What is the Catholic teaching on lying? Are there exceptions?**
   - Context: User asks about "white lies" or lying to save a life
   - Key sources: CCC 2482-2487, Augustine on lying

### Scripture (2 questions):
7. **Why do Catholic Bibles have more books than Protestant Bibles?**
   - Context: User noticed deuterocanonical books
   - Key sources: CCC 120, Council of Trent, historical background
   
8. **How should Catholics interpret "faith without works is dead" (James 2:26)?**
   - Context: User studying faith and works
   - Key sources: James 2:14-26, CCC 1814-1816, Council of Trent on justification

### Sacraments/Liturgy (2 questions):
9. **Why do Catholics baptize infants?**
   - Context: Baptist friend says only adult baptism is valid
   - Key sources: CCC 1250-1252, Acts 16:15, early Church practice
   
10. **What makes the Mass a sacrifice?**
    - Context: User doesn't understand sacrificial language
    - Key sources: CCC 1362-1372, Hebrews 9-10, Council of Trent

---

## 📋 Template Reminder:

Each answer should include:
- ✅ `<summary>` - Brief 1-2 sentence answer
- ✅ `<explanation>` - Detailed theological explanation
- ✅ `<citations>` - Minimum 3-4 sources with exact quotes
- ✅ `<practical_application>` - How this applies to Catholic life

### JSONL Format (one line per example):
```jsonl
{"system": "You are TheoAgent, a Catholic theological assistant. Provide accurate, well-sourced answers based on Sacred Scripture, Sacred Tradition, and the Magisterium. Always cite specific sources using the format [Source: Document, Paragraph]. Distinguish between definitive teachings and theological opinions. Use clear, accessible language while maintaining theological precision.", "messages": [{"role": "user", "content": "<question>Your question here</question>\n<context>Context about the question</context>"}, {"role": "assistant", "content": "<answer>\n<summary>Brief answer</summary>\n\n<explanation>\nDetailed explanation here\n</explanation>\n\n<citations>\n[Source: CCC 123] \"Exact quote\"\n[Source: Document, Section] \"Quote\"\n</citations>\n\n<practical_application>\nHow this applies to life\n</practical_application>\n</answer>"}]}
```

---

## ⚡ Quick Start Steps:

1. **Pick Question #1** from the list above
2. **Open CCC online**: https://www.usccb.org/beliefs-and-teachings/what-we-believe/catechism
3. **Research the topic** using the suggested sources
4. **Write your answer** following the template
5. **Format as single-line JSON** 
6. **Save to**: `collected_data/batch_01.jsonl`
7. **Validate**: Run the validation script
8. **Repeat** for questions 2-10

---

## 🎓 Pro Tips:

- **Start with doctrinal questions** - Usually have clearest answers in CCC
- **Keep CCC open** - It's your primary reference
- **Quote directly** - Copy exact text from sources
- **Check line breaks** - Each JSON object must be ONE line in the .jsonl file
- **Validate often** - Run validator after adding each example
- **Quality first** - Better to have 3 perfect examples than 10 mediocre ones

---

## 📚 Essential Resources:

1. **Catechism of the Catholic Church**: https://www.usccb.org/beliefs-and-teachings/what-we-believe/catechism
2. **Vatican Documents**: https://www.vatican.va/content/vatican/en.html
3. **Catholic Answers**: https://www.catholic.com/qa
4. **New Advent Encyclopedia**: https://www.newadvent.org/cathen/
5. **Bible (NABRE)**: https://bible.usccb.org/

---

## 🚀 Your Goal Today:

**Create 3-5 high-quality Q&A pairs**

Don't rush! Quality matters more than speed. Each example should be:
- Theologically accurate ✓
- Well-cited ✓
- Clearly written ✓
- Properly formatted ✓

---

## ✅ Checklist for Each Q&A:

- [ ] Question is clear and specific
- [ ] Context is provided
- [ ] Summary answers the question directly
- [ ] Explanation is thorough and accurate
- [ ] 3-4+ citations included with exact quotes
- [ ] Citations use proper format: `[Source: Document, Paragraph]`
- [ ] Practical application included
- [ ] All XML tags properly closed
- [ ] Valid JSON (no syntax errors)
- [ ] Entire JSON on single line
- [ ] Validated with script

---

**Ready? Start with Question #1: "What is the Holy Trinity?"**

Good luck! 🎉
