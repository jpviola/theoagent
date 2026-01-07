# Training Data Collection Guide for TheoAgent

This directory contains templates and instructions for collecting high-quality theological Q&A training data for fine-tuning Claude models.

---

## 📁 File Structure

```
training_data/
├── README.md                          # This file - instructions and guidelines
├── TEMPLATE.jsonl                     # Main template with 5 example Q&A pairs
├── template_examples/                 # Additional examples by category
│   ├── doctrinal_theology.jsonl      # Doctrine examples
│   ├── moral_theology.jsonl          # Moral/ethical examples
│   ├── scripture_exegesis.jsonl      # Biblical interpretation examples
│   ├── liturgy_sacraments.jsonl      # Liturgical examples
│   └── church_history.jsonl          # Historical examples
├── collected_data/                    # Your collected training data
│   ├── batch_01.jsonl
│   ├── batch_02.jsonl
│   └── ...
└── validated_data/                    # Quality-validated data ready for training
    └── final_training_set.jsonl
```

---

## 🎯 Goal: Collect 500 High-Quality Q&A Pairs

### Target Distribution:

| Category | Target Count | Purpose |
|----------|--------------|---------|
| **Doctrinal Theology** | 150 | Core Catholic teachings, Trinitarian theology, Christology, ecclesiology |
| **Moral Theology** | 120 | Ethical questions, application of moral principles, contemporary issues |
| **Scripture Exegesis** | 100 | Biblical interpretation, understanding key passages |
| **Liturgy & Sacraments** | 80 | Mass, sacraments, liturgical practices |
| **Prayer & Spirituality** | 50 | Prayer life, spiritual practices, saints |

---

## 📝 JSONL Format Requirements

### Basic Structure:

Each line in a `.jsonl` file is a complete JSON object representing one training example:

```jsonl
{"system": "System prompt here", "messages": [{"role": "user", "content": "Question"}, {"role": "assistant", "content": "Answer"}]}
```

**Important:** 
- Each JSON object must be on a single line
- No line breaks within the JSON object
- Each line is separated by a newline character

---

## 🏗️ Template Structure Explained

### 1. System Prompt (Required)

```json
{
  "system": "You are TheoAgent, a Catholic theological assistant. Provide accurate, well-sourced answers based on Sacred Scripture, Sacred Tradition, and the Magisterium. Always cite specific sources using the format [Source: Document, Paragraph]. Distinguish between definitive teachings and theological opinions. Use clear, accessible language while maintaining theological precision."
}
```

**Purpose:** Sets the AI's role, expertise, and response guidelines

**Keep consistent across all examples** for best fine-tuning results.

---

### 2. User Message (Question)

Use XML tags to structure the question:

```xml
<question>What is the Real Presence in the Eucharist?</question>
<context>User is asking about Catholic Eucharistic theology</context>
```

**Components:**
- `<question>`: The actual user question
- `<context>`: (Optional) Additional context about the question, user's background, or intent

---

### 3. Assistant Message (Answer)

Use XML tags to structure comprehensive answers:

```xml
<answer>
  <summary>Brief, direct answer (1-2 sentences)</summary>
  
  <explanation>
    Detailed theological explanation
    
    <key_points>
      1. First key point
      2. Second key point
      3. Third key point
    </key_points>
  </explanation>
  
  <citations>
    [Source: CCC 1234] "Exact quote from source"
    [Source: Document Name, Paragraph] "Quote"
  </citations>
  
  <practical_application>
    How this teaching applies to Catholic life
  </practical_application>
</answer>
```

**Required Components:**
- `<summary>`: Quick, direct answer
- `<explanation>`: Full theological treatment
- `<citations>`: Specific source references (CCC, Scripture, Church documents)
- `<practical_application>`: Pastoral guidance

**Optional Components:**
- `<key_points>`: Bulleted key takeaways
- `<common_confusion>`: Address misconceptions
- `<theological_note>`: Nuances or clarifications
- `<historical_context>`: Background information

---

## 📚 Citation Format Standards

### Always use this format:

```
[Source: Document Name, Paragraph/Section]
```

### Examples:

✅ **Correct:**
- `[Source: CCC 1374]`
- `[Source: Lumen Gentium, 16]`
- `[Source: Pope John Paul II, Veritatis Splendor, 55]`
- `[Source: John 6:51]` (Scripture)
- `[Source: Council of Trent, Session 13]`

❌ **Incorrect:**
- `CCC 1374` (missing [Source: ])
- `[Lumen Gentium 16]` (inconsistent format)
- `See CCC paragraph 1374` (too verbose)

### When to Cite:

- **Always cite** for doctrinal statements
- **Always cite** Scripture passages
- **Always cite** Magisterial documents
- Include **exact quotes** in quotation marks after citation
- Use **multiple sources** to support complex teachings

---

## ✅ Quality Standards Checklist

Before adding a Q&A pair to your training data, verify:

### Theological Accuracy ✓
- [ ] Answer aligns with Catholic doctrine
- [ ] No theological errors or heterodoxy
- [ ] Distinguishes between doctrine and opinion
- [ ] Properly represents magisterial teaching

### Citation Quality ✓
- [ ] All major claims are cited
- [ ] Citations use proper format `[Source: Document, Paragraph]`
- [ ] Quotes are accurate (verify against original sources)
- [ ] Mix of Scripture, CCC, and Church documents

### Completeness ✓
- [ ] Question is clear and specific
- [ ] Answer addresses the full question
- [ ] Includes summary, explanation, and citations
- [ ] Provides practical application (when appropriate)

### Clarity ✓
- [ ] Language is clear and accessible
- [ ] Technical terms are explained
- [ ] Answer is well-organized with XML tags
- [ ] Appropriate length (not too brief, not unnecessarily long)

### Format ✓
- [ ] Valid JSON (no syntax errors)
- [ ] Entire JSON object on single line
- [ ] Proper XML tag structure
- [ ] System prompt included

---

## 🎨 Example Categories & Topics

### Doctrinal Theology (150 examples)
- Trinity and divine nature
- Christology (person and work of Christ)
- Mariology (Marian doctrines)
- Ecclesiology (nature of the Church)
- Eschatology (last things)
- Sacramental theology
- Grace and salvation

### Moral Theology (120 examples)
- Natural law and conscience
- Cardinal and theological virtues
- Social justice teachings
- Bioethics (life issues)
- Sexual ethics
- Economic justice
- War and peace

### Scripture Exegesis (100 examples)
- Gospel passages
- Pauline epistles
- Old Testament interpretation
- Difficult passages
- Typology and fulfillment
- Historical-critical method
- Four senses of Scripture

### Liturgy & Sacraments (80 examples)
- Mass structure and meaning
- Seven sacraments
- Liturgical calendar
- Sacred music
- Sacramentals
- Devotional practices

### Prayer & Spirituality (50 examples)
- Prayer types and methods
- Saints and their teachings
- Spiritual direction
- Discernment
- Contemplative prayer
- Liturgy of the Hours

---

## 🔍 Where to Find Quality Source Material

### Primary Sources:
1. **Catechism of the Catholic Church (CCC)** - Most comprehensive
2. **Vatican II Documents** - Modern Church teaching
3. **Papal Encyclicals** - Authoritative magisterial teaching
4. **Sacred Scripture** - Word of God
5. **Code of Canon Law** - Church law
6. **Early Church Fathers** - Patristic theology

### Reputable Q&A Sources:
- **Catholic Answers Forum** (catholic.com/qa)
- **EWTN Q&A Library** (ewtn.com/catholicism/library)
- **Vatican.va Official Documents**
- **New Advent Catholic Encyclopedia**
- **US Conference of Catholic Bishops (usccb.org)**

### Academic Sources:
- Catholic theology textbooks
- Seminary formation materials
- Theological journals
- University theology department resources

---

## 🚫 Common Mistakes to Avoid

### ❌ Poor Quality Examples:

**1. Vague Questions:**
```json
{"role": "user", "content": "Tell me about Mary"}
```
❌ Too broad, unclear focus

✅ **Better:**
```json
{"role": "user", "content": "<question>What is the Catholic doctrine of Mary's Assumption?</question>\n<context>User wants to understand this Marian dogma</context>"}
```

**2. Incomplete Answers:**
```json
{"role": "assistant", "content": "The Assumption means Mary went to heaven. See CCC 966."}
```
❌ Too brief, no structure, poor citation format

✅ **Better:** Use full template with summary, explanation, proper citations, practical application

**3. Missing Citations:**
```json
{"role": "assistant", "content": "Catholics believe in transubstantiation. This means the bread and wine become Christ's body and blood."}
```
❌ No sources provided for doctrinal claim

✅ **Better:** Include CCC, Council of Trent, relevant Scripture passages

**4. Theological Errors:**
```json
{"role": "assistant", "content": "Mary was sinless because she was divine."}
```
❌ Heresy - Mary is not divine

✅ **Correct:** "Mary was sinless by grace, not by nature. She was preserved from original sin and remained sinless through God's grace."

**5. Inconsistent Formatting:**
```
{system: "You are TheoAgent...", messages: [...]}
```
❌ Missing quotes around keys, not valid JSON

---

## 📊 Data Collection Workflow

### Week 1-2: Collection Phase

1. **Choose a topic area** (e.g., Sacraments)
2. **Gather 20-30 common questions** on that topic
3. **Research answers** using CCC, Vatican documents, Scripture
4. **Write comprehensive answers** following the template
5. **Format as JSONL** (one line per example)
6. **Save to `collected_data/`**

### Week 3: Validation Phase

1. **Theological review**: Check all answers against sources
2. **Format validation**: Ensure proper JSON and XML structure
3. **Citation verification**: Verify all quotes are accurate
4. **Quality filtering**: Remove or revise poor examples
5. **Move validated data to `validated_data/`**

### Week 4: Finalization

1. **Combine all validated files** into `final_training_set.jsonl`
2. **Create validation split** (10-20% held out for testing)
3. **Count examples per category**
4. **Final quality check**
5. **Ready for fine-tuning!**

---

## 🛠️ Tools & Scripts

### JSON Validator

Use online JSON validators to check format:
- https://jsonlint.com/
- https://jsonformatter.org/

### JSONL Format Checker

```python
import json

def validate_jsonl(filepath):
    """Check if file is valid JSONL format"""
    with open(filepath, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                # Check required fields
                assert 'system' in data, f"Line {i}: Missing 'system' field"
                assert 'messages' in data, f"Line {i}: Missing 'messages' field"
                print(f"✓ Line {i}: Valid")
            except json.JSONDecodeError as e:
                print(f"✗ Line {i}: JSON error - {e}")
            except AssertionError as e:
                print(f"✗ Line {i}: {e}")

# Usage:
validate_jsonl('collected_data/batch_01.jsonl')
```

### Citation Checker

```python
import re

def check_citations(answer_text):
    """Find all citations in answer"""
    pattern = r'\[Source: [^\]]+\]'
    citations = re.findall(pattern, answer_text)
    
    if not citations:
        print("⚠️ Warning: No citations found")
    else:
        print(f"✓ Found {len(citations)} citations:")
        for cite in citations:
            print(f"  - {cite}")

# Usage:
check_citations(your_answer_text)
```

---

## 📈 Progress Tracking

### Use this checklist:

- [ ] **Phase 1:** 100 examples collected (Weeks 1-2)
  - [ ] 30 Doctrinal
  - [ ] 25 Moral
  - [ ] 20 Scripture
  - [ ] 15 Liturgy
  - [ ] 10 Spirituality

- [ ] **Phase 2:** 300 examples collected (Weeks 3-4)
  - [ ] 90 Doctrinal (total)
  - [ ] 75 Moral (total)
  - [ ] 60 Scripture (total)
  - [ ] 45 Liturgy (total)
  - [ ] 30 Spirituality (total)

- [ ] **Phase 3:** 500+ examples collected (Weeks 5-6)
  - [ ] 150 Doctrinal (total)
  - [ ] 120 Moral (total)
  - [ ] 100 Scripture (total)
  - [ ] 80 Liturgy (total)
  - [ ] 50 Spirituality (total)

- [ ] **Validation:** All examples reviewed and validated
- [ ] **Final Set:** Combined into `final_training_set.jsonl`
- [ ] **Test Split:** 10-20% held out for evaluation

---

## 🎓 Best Practices Summary

### DO ✅
- Use consistent system prompts
- Include comprehensive citations
- Structure with XML tags
- Verify theological accuracy
- Provide practical application
- Write clear, accessible explanations
- Cover diverse topics
- Check JSON validity

### DON'T ❌
- Copy/paste without verification
- Include theological errors
- Use poor citation format
- Write vague questions
- Give incomplete answers
- Skip validation steps
- Ignore formatting standards
- Rush the collection process

---

## 🤝 Getting Help

### Questions about:
- **Theology**: Consult CCC, catholic.com, or a priest/theologian
- **Format**: Review `TEMPLATE.jsonl` examples
- **JSON**: Use online validators, check syntax carefully
- **Citations**: Verify all quotes against original sources

### Resources:
- [Catechism of the Catholic Church Online](https://www.usccb.org/beliefs-and-teachings/what-we-believe/catechism/catechism-of-the-catholic-church)
- [Vatican Documents](https://www.vatican.va/content/vatican/en.html)
- [New Advent Catholic Encyclopedia](https://www.newadvent.org/cathen/)
- [Catholic Answers](https://www.catholic.com/)

---

## 🚀 Ready to Start?

1. **Read this entire README**
2. **Study the examples in `TEMPLATE.jsonl`**
3. **Choose your first topic area**
4. **Collect your first 10 Q&A pairs**
5. **Validate format and theology**
6. **Save to `collected_data/batch_01.jsonl`**
7. **Repeat and build your dataset!**

**Goal:** 500 high-quality examples over 6-8 weeks

**Quality > Quantity:** Better to have 300 excellent examples than 1000 mediocre ones!

---

## 📝 Version History

- **v1.0** (Dec 2024): Initial template and guidelines created
- Target: Fine-tune Claude 3 Haiku for TheoAgent theological responses

---

**Questions?** Review the `FINE_TUNING_BEST_PRACTICES.md` document for more details on data quality requirements and training procedures.
