# Quick Reference Guide - Your 3 Questions

Complete these 3 questions first, then I'll help with the remaining 7.

---

## Question 1: Holy Trinity

**Your Task:** Replace TODO sections in Line 1 of batch_01.jsonl

**Key CCC Sections:**
- CCC 232-237: Faith in One God
- CCC 238-248: God the Father
- CCC 249-256: The Holy Trinity
- CCC 261-267: Trinity in Christian life

**Essential Quotes to Find:**
- CCC 253: "The Trinity is One"
- CCC 234: Three divine persons
- CCC 261: Trinity and prayer
- CCC 266: Faith in Trinity

**Scripture:**
- Matthew 28:19 - "baptizing them in the name of the Father, and of the Son, and of the Holy Spirit"
- John 14:16-17 - Jesus promises the Holy Spirit
- 2 Corinthians 13:13 - Trinitarian blessing

**What to Write:**
- **Summary**: One God in three divine persons - Father, Son, Holy Spirit - co-equal, co-eternal, one divine nature
- **Explanation**: Not three gods, but one God in three persons; mystery beyond full comprehension; revealed gradually through Scripture
- **Key Points**: Three persons, one essence; Father unbegotten, Son begotten, Spirit proceeds; co-equal and co-eternal
- **Practical**: Sign of the Cross, Glory Be prayer, baptismal formula

---

## Question 3: Mary - Mother of God

**Your Task:** Replace TODO sections in Line 3 of batch_01.jsonl

**Key CCC Sections:**
- CCC 495: Mary is "Mother of God"
- CCC 466: One person in Christ
- CCC 509: Theotokos

**Essential Quotes to Find:**
- CCC 495: Council of Ephesus quote
- CCC 466: "The one person is both divine and human"

**Scripture:**
- Luke 1:43 - Elizabeth: "mother of my Lord"
- Luke 1:35 - Angel announces conception

**Historical:**
- Council of Ephesus (431 AD) - Defined Theotokos against Nestorius
- Nestorius wanted "Christotokos" (Mother of Christ) only

**What to Write:**
- **Summary**: Mary gave birth to Jesus who is one divine person - mothers give birth to persons, not natures
- **Explanation**: Jesus is one person (divine) with two natures (divine & human); Mary is mother of the person (who is God); doesn't mean she pre-existed God
- **Key Points**: Theotokos = God-bearer; protects unity of Christ; Nestorius's error; mothers birth persons
- **Practical**: Honors Mary's unique role; guards Christology; shows Jesus is God from conception

---

## Question 9: Infant Baptism

**Your Task:** Replace TODO sections in Line 9 of batch_01.jsonl

**Key CCC Sections:**
- CCC 1250-1252: Infant baptism practice
- CCC 1213-1216: Baptism removes original sin
- CCC 1257: Necessity of baptism

**Essential Quotes to Find:**
- CCC 1250: "Born with fallen human nature... need new birth in Baptism"
- CCC 1252: "Practice of infant Baptism... tradition of immemorial origin"

**Scripture:**
- Acts 16:15 - "She and her household were baptized"
- Acts 16:33 - Jailer "and all his family were baptized"
- 1 Corinthians 1:16 - "I baptized also the household of Stephanas"
- Mark 10:14 - "Let the children come to me"

**What to Write:**
- **Summary**: Infants need baptism to remove original sin; grace is God's gift not earned by faith decision; early Church practice; whole households baptized
- **Explanation**: Original sin needs cleansing; baptism is God's gift of grace; faith of parents/Church supports infant; parallel to circumcision
- **Key Points**: Removes original sin; grace not earned; early Church practice; household baptisms in Acts; parents present child to God
- **Practical**: Baptize soon after birth; raise in faith; child later confirms at Confirmation

---

## 🔧 How to Edit the JSONL File:

1. **Open**: training_data/collected_data/batch_01.jsonl
2. **Find the line** for your question (Lines 1, 3, 9)
3. **Replace** each TODO with your researched content
4. **Keep** all XML tags intact: `<summary>`, `<explanation>`, `<citations>`, etc.
5. **Keep** the entire JSON on ONE LINE (don't add line breaks within the JSON)

## ✅ Citation Format Examples:

**Good:**
```
[Source: CCC 253] "The Trinity is One. We do not confess three Gods, but one God in three persons, the 'consubstantial Trinity.'"
```

**Good:**
```
[Source: Luke 1:43] "And how does this happen to me, that the mother of my Lord should come to me?"
```

**Bad:**
```
CCC 253 says the Trinity is one
```

**Bad:**
```
[See CCC 253]
```

---

## 📋 Checklist for Each Question:

- [ ] Summary written (1-2 clear sentences)
- [ ] Explanation written (2-3 paragraphs)
- [ ] Key points listed (3-5 bullets)
- [ ] 4-5 citations added with EXACT quotes
- [ ] Citation format correct: [Source: Document, Paragraph] "Quote"
- [ ] Practical application written
- [ ] All TODO removed
- [ ] XML tags intact
- [ ] Entire JSON still on one line

---

## 🚀 Getting Started:

### Step 1: Research Trinity
1. Go to: https://www.usccb.org/beliefs-and-teachings/what-we-believe/catechism/catechism-of-the-catholic-church/epub/index.cfm
2. Navigate to CCC 232-267
3. Take notes on key quotes

### Step 2: Write Content
1. Open batch_01.jsonl
2. Find Line 1 (Trinity question)
3. Replace TODO sections

### Step 3: Validate
```bash
python training_data/validate_training_data.py training_data/collected_data/batch_01.jsonl
```

---

## ⏰ Time Estimate:

- Trinity: 45-60 minutes
- Mary: 30-45 minutes  
- Infant Baptism: 30-45 minutes
- **Total: 2-3 hours**

---

## 💡 Tips:

- **Copy exact quotes** from CCC (don't paraphrase citations)
- **Use Ctrl+F** to find paragraph numbers quickly
- **Keep it clear** - avoid overly technical language
- **Be thorough** - better too much detail than too little
- **Save often** - don't lose your work!

---

## 🆘 If You Get Stuck:

- Check TEMPLATE.jsonl for completed examples
- Reference the 5 complete examples already in the file
- Ask me for help anytime

---

**Ready? Start with the Holy Trinity! 📚**

Open CCC 232-267 and begin taking notes!
