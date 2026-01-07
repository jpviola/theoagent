import json
import sys
from pathlib import Path

def validate_jsonl_file(filepath):
    """
    Validates a JSONL file for training data quality.
    Checks: JSON syntax, required fields, citation format, XML structure.
    """
    print(f"\n🔍 Validating: {filepath}")
    print("=" * 60)
    
    valid_count = 0
    error_count = 0
    warning_count = 0
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        if not lines:
            print("❌ ERROR: File is empty")
            return False
            
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                print(f"⚠️  Line {i}: Empty line (skipping)")
                warning_count += 1
                continue
                
            try:
                # Parse JSON
                data = json.loads(line)
                
                # Check required top-level fields
                if 'system' not in data:
                    print(f"❌ Line {i}: Missing 'system' field")
                    error_count += 1
                    continue
                    
                if 'messages' not in data:
                    print(f"❌ Line {i}: Missing 'messages' field")
                    error_count += 1
                    continue
                
                # Check messages structure
                messages = data['messages']
                if not isinstance(messages, list):
                    print(f"❌ Line {i}: 'messages' must be a list")
                    error_count += 1
                    continue
                
                if len(messages) != 2:
                    print(f"⚠️  Line {i}: Expected 2 messages (user + assistant), found {len(messages)}")
                    warning_count += 1
                
                # Check user message
                user_msg = messages[0]
                if user_msg.get('role') != 'user':
                    print(f"❌ Line {i}: First message must have role='user'")
                    error_count += 1
                    continue
                
                # Check assistant message
                asst_msg = messages[1]
                if asst_msg.get('role') != 'assistant':
                    print(f"❌ Line {i}: Second message must have role='assistant'")
                    error_count += 1
                    continue
                
                # Check for citations in answer
                answer_content = asst_msg.get('content', '')
                if '[Source:' not in answer_content:
                    print(f"⚠️  Line {i}: No citations found in answer")
                    warning_count += 1
                
                # Check for XML structure
                required_tags = ['<answer>', '<summary>', '<explanation>', '<citations>']
                missing_tags = [tag for tag in required_tags if tag not in answer_content]
                if missing_tags:
                    print(f"⚠️  Line {i}: Missing XML tags: {', '.join(missing_tags)}")
                    warning_count += 1
                
                # If we got here, line is valid
                valid_count += 1
                print(f"✅ Line {i}: Valid")
                
            except json.JSONDecodeError as e:
                print(f"❌ Line {i}: JSON syntax error - {e}")
                error_count += 1
            except Exception as e:
                print(f"❌ Line {i}: Unexpected error - {e}")
                error_count += 1
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        print(f"✅ Valid examples: {valid_count}")
        print(f"⚠️  Warnings: {warning_count}")
        print(f"❌ Errors: {error_count}")
        print(f"📄 Total lines: {len(lines)}")
        
        if error_count == 0:
            print("\n✨ File is valid and ready for training!")
            return True
        else:
            print(f"\n⚠️  File has {error_count} error(s) that must be fixed")
            return False
            
    except FileNotFoundError:
        print(f"❌ ERROR: File not found - {filepath}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def check_citations(answer_text):
    """Extract and display all citations from an answer"""
    import re
    pattern = r'\[Source: [^\]]+\]'
    citations = re.findall(pattern, answer_text)
    return citations

def analyze_jsonl_file(filepath):
    """
    Provides detailed analysis of training data file.
    Shows statistics about questions, answers, citations, etc.
    """
    print(f"\n📈 ANALYZING: {filepath}")
    print("=" * 60)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip()]
        
        total_examples = len(lines)
        total_citations = 0
        total_question_length = 0
        total_answer_length = 0
        citation_types = {}
        
        for line in lines:
            data = json.loads(line)
            messages = data.get('messages', [])
            
            if len(messages) >= 2:
                # Question analysis
                question = messages[0].get('content', '')
                total_question_length += len(question.split())
                
                # Answer analysis
                answer = messages[1].get('content', '')
                total_answer_length += len(answer.split())
                
                # Citation analysis
                citations = check_citations(answer)
                total_citations += len(citations)
                
                for cite in citations:
                    # Extract source type (e.g., "CCC", "Lumen Gentium", etc.)
                    source = cite.split('[Source:')[1].split(',')[0].strip() if ',' in cite else cite.split(']')[0].split(':')[1].strip()
                    citation_types[source] = citation_types.get(source, 0) + 1
        
        # Display statistics
        print(f"\n📊 Statistics:")
        print(f"  Total examples: {total_examples}")
        print(f"  Total citations: {total_citations}")
        print(f"  Avg citations per example: {total_citations/total_examples:.1f}")
        print(f"  Avg question length: {total_question_length/total_examples:.0f} words")
        print(f"  Avg answer length: {total_answer_length/total_examples:.0f} words")
        
        print(f"\n📚 Citation Sources (Top 10):")
        sorted_sources = sorted(citation_types.items(), key=lambda x: x[1], reverse=True)[:10]
        for source, count in sorted_sources:
            print(f"  {source}: {count}")
        
        print(f"\n✨ Analysis complete!")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_training_data.py <filepath> [--analyze]")
        print("\nExamples:")
        print("  python validate_training_data.py training_data/TEMPLATE.jsonl")
        print("  python validate_training_data.py collected_data/batch_01.jsonl --analyze")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    # Run validation
    is_valid = validate_jsonl_file(filepath)
    
    # Run analysis if requested
    if len(sys.argv) > 2 and sys.argv[2] == '--analyze':
        if is_valid:
            analyze_jsonl_file(filepath)
    
    sys.exit(0 if is_valid else 1)
