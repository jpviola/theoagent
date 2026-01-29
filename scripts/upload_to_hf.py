from huggingface_hub import HfApi, create_repo
import os

# Configuración
repo_id = "fpetrel95/santa-palabra-llama3-8b-gguf"
local_file = "models/santa-palabra-llama3.gguf"
repo_filename = "santa-palabra-llama3.gguf"

# Verificar que el archivo existe
if not os.path.exists(local_file):
    print(f"❌ Error: No se encuentra el archivo local en: {local_file}")
    print(f"Directorio actual: {os.getcwd()}")
    exit(1)

api = HfApi()

try:
    # Crear el repositorio si no existe
    print(f"🔨 Verificando/Creando repositorio {repo_id}...")
    try:
        create_repo(repo_id, repo_type="model", exist_ok=True)
        print(f"✅ Repositorio listo.")
    except Exception as e:
        print(f"⚠️ Advertencia al crear repositorio: {str(e)}")
        print("➡️ Intentando subir archivo de todas formas (asumiendo que existe)...")

    # Subir el archivo
    print(f"🚀 Iniciando subida de {local_file}...")
    api.upload_file(
        path_or_fileobj=local_file,
        path_in_repo=repo_filename,
        repo_id=repo_id,
        repo_type="model"
    )
    print("✅ ¡Subida completada exitosamente!")

except Exception as e:
    print(f"❌ Ocurrió un error: {str(e)}")
