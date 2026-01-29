from unsloth import FastLanguageModel
import torch
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

# 1. Configuration
max_seq_length = 2048
dtype = None # Auto detection
load_in_4bit = True 

print("🚀 Loading Unsloth Llama-3 model...")

# 2. Load Model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3-8b-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 3. Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# 4. Load Dataset
print("📚 Loading dataset from ../datasets/fine_tuning_data.jsonl...")
dataset = load_dataset("json", data_files="../datasets/fine_tuning_data.jsonl", split="train")

# Format function
def formatting_prompts_func(examples):
    conversations = examples["messages"]
    texts = []
    for conv in conversations:
        # ChatML format
        text = ""
        for msg in conv:
            role = msg["role"]
            content = msg["content"]
            text += f"<|im_start|>{role}\n{content}<|im_end|>\n"
        texts.append(text)
    return { "text" : texts, }

dataset = dataset.map(formatting_prompts_func, batched = True,)

# 5. Training
print("🏃 Starting training...")
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 100, # Start small for testing, increase for full training (e.g. 1000+)
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer.train()

# 6. Save
print("💾 Saving model...")
model.save_pretrained("lora_model")
tokenizer.save_pretrained("lora_model")
print("✅ Model saved to lora_model")

# Optional: Export to Ollama (GGUF)
# model.save_pretrained_gguf("model_gguf", tokenizer, quantization_method = "q4_k_m")
