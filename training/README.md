# Entrenamiento de Santa Palabra con Unsloth

Esta carpeta contiene los scripts para entrenar el modelo Llama-3 localmente usando Unsloth.

## Prerrequisitos
1. **WSL2** instalado con Ubuntu.
2. **GPU NVIDIA** con drivers actualizados en Windows.
3. Dataset generado en `../datasets/fine_tuning_data.jsonl` (Ya generado por `scripts/prepare-fine-tuning-data.ts`).

## Pasos

1. Abre tu terminal de Ubuntu (WSL).
2. Navega a la carpeta del proyecto (ajusta la ruta si es diferente):
   ```bash
   cd "/mnt/c/Users/Juan Pablo/santaPalabra/training"
   ```
3. Da permisos de ejecución al script de instalación:
   ```bash
   chmod +x setup_wsl.sh
   ```
4. Ejecuta la instalación (tardará unos minutos):
   ```bash
   ./setup_wsl.sh
   ```
5. Inicia el entrenamiento:
   ```bash
   source venv/bin/activate
   python train_unsloth.py
   ```

## Resultado
El modelo entrenado (adaptadores LoRA) se guardará en la carpeta `lora_model`.

## Exportar a Ollama (Opcional)
Para usar el modelo en la app localmente con Ollama:
1. Edita `train_unsloth.py` y descomenta la última línea:
   ```python
   model.save_pretrained_gguf("model_gguf", tokenizer, quantization_method = "q4_k_m")
   ```
2. Crea el modelo en Ollama usando el archivo GGUF generado.
