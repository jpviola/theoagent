# Fine-Tuning Readiness Checker

import json
import os
from pathlib import Path

def check_training_data_readiness():
    """Check if we have enough training data for fine-tuning"""
    
    print("🔍 Checking Fine-Tuning Readiness")
    print("=" * 40)
    
    # Check training data files
    training_dir = Path("training_data/collected_data")
    jsonl_files = list(training_dir.glob("*.jsonl"))
    
    total_examples = 0
    valid_files = 0
    
    for file_path in jsonl_files:
        if file_path.name.endswith("_backup.jsonl"):
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                examples = len([line for line in lines if line.strip()])
                total_examples += examples
                valid_files += 1
                print(f"✅ {file_path.name}: {examples} examples")
        except Exception as e:
            print(f"❌ Error reading {file_path.name}: {e}")
    
    print(f"\n📊 Summary:")
    print(f"   Total training files: {valid_files}")
    print(f"   Total training examples: {total_examples}")
    
    # Requirements check
    print(f"\n📋 Requirements Check:")
    
    requirements = [
        ("Minimum examples for basic fine-tuning", 100, total_examples >= 100),
        ("Recommended examples for good results", 300, total_examples >= 300),
        ("Optimal examples for excellent results", 500, total_examples >= 500)
    ]
    
    for desc, threshold, passed in requirements:
        status = "✅" if passed else "❌"
        print(f"   {status} {desc}: {total_examples}/{threshold}")
    
    # Cost estimation
    if total_examples > 0:
        avg_tokens_per_example = 500  # Conservative estimate
        total_tokens = total_examples * avg_tokens_per_example
        training_cost = (total_tokens / 1000) * 0.008  # $0.008 per 1K tokens
        
        print(f"\n💰 Estimated Fine-Tuning Costs:")
        print(f"   Estimated tokens: {total_tokens:,}")
        print(f"   Training cost: ${training_cost:.2f}")
        print(f"   With 5 hyperparameter runs: ${training_cost * 5:.2f}")
    
    # Recommendations
    print(f"\n🎯 Recommendations:")
    
    if total_examples < 100:
        print("   ❌ INSUFFICIENT DATA - Create more training examples")
        print("   📝 Need at least 94 more examples before fine-tuning")
        print("   💡 Focus on creating diverse Q&A pairs covering:")
        print("      - Moral theology, Liturgy, Scripture, Church history")
        
    elif total_examples < 300:
        print("   ⚠️  MINIMAL DATA - Fine-tuning possible but results may be limited")
        print("   📝 Consider adding more examples for better results")
        
    else:
        print("   ✅ GOOD DATA VOLUME - Ready for fine-tuning")
        print("   🚀 Proceed with AWS Bedrock setup")
    
    return total_examples >= 100

if __name__ == "__main__":
    ready = check_training_data_readiness()
    
    if not ready:
        print(f"\n📚 Next Steps:")
        print(f"   1. Create more JSONL training files")
        print(f"   2. Use: python validate_training_data.py to check quality")
        print(f"   3. Run this script again when you have 100+ examples")
    else:
        print(f"\n🚀 Ready for Fine-Tuning!")
        print(f"   1. Run: python scripts/bedrock_setup.py")
        print(f"   2. Configure AWS credentials")
        print(f"   3. Start fine-tuning job")