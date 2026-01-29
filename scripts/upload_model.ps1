# scripts/upload_model.ps1
Write-Host "🚀 Iniciando proceso de subida a Hugging Face..."

# 1. Verificar instalación de Python
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python no encontrado. Por favor instálalo desde python.org o Microsoft Store."
    exit
}

# 2. Verificar/Instalar huggingface_hub
if (-not (Get-Command "huggingface-cli" -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando herramienta 'huggingface_hub'..."
    pip install huggingface_hub
}

# 3. Login
Write-Host "`n🔑 PASO 1: AUTENTICACIÓN"
Write-Host "Si ya estás logueado, el sistema usará tu token guardado."
Write-Host "Si no, te pedirá tu Token de Hugging Face."
Write-Host "👉 Consíguelo aquí (debe ser tipo WRITE): https://huggingface.co/settings/tokens"
huggingface-cli login

# 4. Datos del repositorio
Write-Host "`n📝 PASO 2: DATOS DEL REPOSITORIO"
$repoName = Read-Host "Ingresa el nombre de tu repositorio (ej: jpperez/santa-palabra-llama3-8b-gguf)"

if ([string]::IsNullOrWhiteSpace($repoName)) {
    Write-Host "❌ El nombre del repositorio es obligatorio."
    exit
}

# 5. Subida
$modelPath = "..\models\santa-palabra-llama3.gguf"
if (-not (Test-Path $modelPath)) {
    Write-Host "❌ No encuentro el modelo en $modelPath"
    exit
}

Write-Host "`n📤 PASO 3: SUBIENDO MODELO (Esto puede tardar dependiendo de tu internet...)"
huggingface-cli upload $repoName $modelPath "santa-palabra-llama3.gguf"

Write-Host "`n✅ ¡Subida completada con éxito!"
Write-Host "🌍 Tu modelo está disponible en: https://huggingface.co/$repoName"
