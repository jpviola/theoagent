# AWS Bedrock Fine-Tuning Setup Commands
# Run these commands in your terminal after installing AWS CLI

# 1. Configure AWS CLI with your credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)

# 2. Create IAM role for Bedrock fine-tuning
aws iam create-role \
    --role-name BedrockFineTuningRole \
    --assume-role-policy-document file://aws_configs/bedrock-trust-policy.json

# 3. Attach permissions policy to the role
aws iam put-role-policy \
    --role-name BedrockFineTuningRole \
    --policy-name BedrockFineTuningPermissions \
    --policy-document file://aws_configs/bedrock-permissions-policy.json

# 4. Get the role ARN (you'll need this)
aws iam get-role --role-name BedrockFineTuningRole --query 'Role.Arn' --output text

# 5. Request model access (if not done via console)
# This must be done via AWS Console: Bedrock → Model Access → Request Access

# 6. Create S3 bucket for training data
aws s3 mb s3://theoagent-training-data-$(date +%s) --region us-east-1

# 7. Upload your training data (when ready)
# aws s3 cp training_data/collected_data/batch_01.jsonl s3://your-bucket-name/training/

# 8. List available models for fine-tuning
aws bedrock list-foundation-models --query 'modelSummaries[?contains(customizationsSupported, `FINE_TUNING`)]'

echo "✅ Setup complete! Check AWS Console for model access approval."
echo "⏰ Model access typically approved within 24-48 hours"
echo "📊 You currently have 6 training examples - need 100+ for effective fine-tuning"