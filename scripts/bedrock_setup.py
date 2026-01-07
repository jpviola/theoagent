# AWS Bedrock Fine-Tuning Setup Script

import boto3
import json
from datetime import datetime

class BedrockFineTuner:
    def __init__(self, region='us-east-1'):
        """Initialize Bedrock client"""
        self.region = region
        self.bedrock = boto3.client('bedrock', region_name=region)
        self.s3 = boto3.client('s3', region_name=region)
        
    def create_s3_bucket(self, bucket_name):
        """Create S3 bucket for training data"""
        try:
            if self.region == 'us-east-1':
                self.s3.create_bucket(Bucket=bucket_name)
            else:
                self.s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': self.region}
                )
            print(f"✅ Created S3 bucket: {bucket_name}")
            return True
        except Exception as e:
            if "BucketAlreadyOwnedByYou" in str(e):
                print(f"✅ S3 bucket already exists: {bucket_name}")
                return True
            else:
                print(f"❌ Error creating bucket: {e}")
                return False
    
    def upload_training_data(self, bucket_name, local_file_path, s3_key):
        """Upload JSONL training data to S3"""
        try:
            self.s3.upload_file(local_file_path, bucket_name, s3_key)
            print(f"✅ Uploaded {local_file_path} to s3://{bucket_name}/{s3_key}")
            return f"s3://{bucket_name}/{s3_key}"
        except Exception as e:
            print(f"❌ Error uploading file: {e}")
            return None
    
    def check_model_access(self):
        """Check if Claude 3 Haiku is accessible for fine-tuning"""
        try:
            response = self.bedrock.list_foundation_models(
                byCustomizationType='FINE_TUNING'
            )
            haiku_models = [
                model for model in response['modelSummaries'] 
                if 'claude-3-haiku' in model['modelId']
            ]
            if haiku_models:
                print("✅ Claude 3 Haiku available for fine-tuning")
                return haiku_models[0]['modelId']
            else:
                print("❌ Claude 3 Haiku not available. Check model access in AWS Console.")
                return None
        except Exception as e:
            print(f"❌ Error checking model access: {e}")
            return None
    
    def create_fine_tuning_job(self, 
                              job_name, 
                              base_model_id, 
                              training_data_s3_uri,
                              role_arn,
                              validation_data_s3_uri=None):
        """Create fine-tuning job"""
        
        job_config = {
            'customizationType': 'FINE_TUNING',
            'baseModelIdentifier': base_model_id,
            'jobName': job_name,
            'customModelName': f"{job_name}-model",
            'roleArn': role_arn,
            'trainingDataConfig': {
                's3Uri': training_data_s3_uri
            },
            'hyperParameters': {
                'learningRateMultiplier': '1.0',
                'batchSize': '16',
                'epochCount': '3'  # Start conservative
            }
        }
        
        if validation_data_s3_uri:
            job_config['validationDataConfig'] = {
                's3Uri': validation_data_s3_uri
            }
        
        try:
            response = self.bedrock.create_model_customization_job(**job_config)
            print(f"✅ Fine-tuning job created: {response['jobArn']}")
            return response['jobArn']
        except Exception as e:
            print(f"❌ Error creating fine-tuning job: {e}")
            return None
    
    def check_job_status(self, job_arn):
        """Check status of fine-tuning job"""
        try:
            response = self.bedrock.get_model_customization_job(jobIdentifier=job_arn)
            status = response['status']
            print(f"Job Status: {status}")
            
            if status == 'Failed':
                print(f"Failure reason: {response.get('failureMessage', 'No message')}")
            elif status == 'Completed':
                print(f"✅ Fine-tuning completed!")
                print(f"Custom model ARN: {response['customModelArn']}")
                
            return response
        except Exception as e:
            print(f"❌ Error checking job status: {e}")
            return None

# Example usage
if __name__ == "__main__":
    # Initialize fine-tuner
    ft = BedrockFineTuner(region='us-east-1')
    
    # Configuration
    BUCKET_NAME = "theoagent-training-data"  # Change to unique name
    ROLE_ARN = "arn:aws:iam::YOUR_ACCOUNT:role/BedrockFineTuningRole"  # You'll need to create this
    
    print("🔧 AWS Bedrock Fine-Tuning Setup")
    print("=" * 40)
    
    # Step 1: Check model access
    base_model_id = ft.check_model_access()
    if not base_model_id:
        print("❌ Cannot proceed without model access")
        exit(1)
    
    # Step 2: Create S3 bucket
    ft.create_s3_bucket(BUCKET_NAME)
    
    # Step 3: Upload training data (when ready)
    # training_s3_uri = ft.upload_training_data(
    #     BUCKET_NAME, 
    #     "training_data/collected_data/batch_01.jsonl",
    #     "training/batch_01.jsonl"
    # )
    
    print("\n📋 Next Steps:")
    print("1. Create IAM role for Bedrock fine-tuning")
    print("2. Create more training data (need 100+ examples)")
    print("3. Upload training data to S3")
    print("4. Start fine-tuning job")
    print("\nRun this script again when you have more training data!")