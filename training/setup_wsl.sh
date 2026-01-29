#!/bin/bash

echo "🚀 Setting up Unsloth environment..."

# 1. Update System
sudo apt update && sudo apt install -y python3-pip python3-venv git build-essential

# 2. Create Virtual Environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# 3. Install Unsloth and Dependencies
echo "Installing Unsloth and Dependencies..."
pip install --upgrade pip


# Install PyTorch and Unsloth (optimized for NVIDIA GPUs)
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes

# Install python-is-python3 to allow 'python' command
echo "🔧 Configuring 'python' alias..."
sudo apt install -y python-is-python3

echo "✅ Setup complete! To start training:"
echo "1. source venv/bin/activate"
echo "2. python train_unsloth.py"
