# SantaPalabra - Asistente Teológico Católico (Open Source)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

Un sofisticado asistente teológico católico impulsado por IA, diseñado para acompañar en la fe con fidelidad al Magisterio.

Este proyecto es **Open Source**. ¡Contribuciones son bienvenidas!

## Características Principales

*   **RAG (Retrieval-Augmented Generation):** Respuestas fundamentadas en documentos oficiales (Catecismo, Magisterio, Biblia).
*   **Modo Especialista:** Respuestas académicas y profundas para sacerdotes y teólogos.
*   **Modo Pastoral:** Respuestas accesibles y catequéticas para fieles laicos.
*   **Soporte Multilingüe:** Español, Inglés y Portugués.
*   **Integración Vectorial:** Usa Supabase (pgvector) para búsqueda semántica.

## Primeros Pasos

### Prerrequisitos

*   Node.js 18+
*   Cuenta en Supabase (para base de datos vectorial)
*   Claves de API de proveedores LLM (Anthropic, OpenRouter/Gemma, Groq, etc.)

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/santaPalabra.git
    cd santaPalabra
    ```

2.  Instala dependencias:
    ```bash
    npm install
    ```

3.  Configura las variables de entorno:
    *   Copia `.env.local.example` a `.env.local`.
    *   Configura al menos un proveedor de LLM (`ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, etc.).
    *   Configura las credenciales de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

4.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

## Arquitectura de Datos y Futuro (Snowflake/Airbyte)

Actualmente, SantaPalabra utiliza **Supabase** como almacén vectorial principal para el sistema RAG.

Si deseas escalar el entrenamiento o ingestión de datos:
*   **Airbyte:** Puede usarse para sincronizar grandes volúmenes de documentos externos (RSS, APIs vaticanas) hacia nuestra base de datos.
*   **Snowflake:** Compatible como almacén de datos (Data Warehouse) si se desea realizar Fine-Tuning masivo en el futuro.

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviarnos pull requests.

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).


## Environment variables

For the Catholic chat to work, you must configure at least one LLM provider.

- Copy `.env.local.example` to `.env.local`
- Set at least one of: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

Optional:
- Gemini: set `GOOGLE_API_KEY` (and optionally `GEMINI_MODEL`)
- Llama (OpenAI-compatible): set `LLAMA_OPENAI_COMPAT_BASE_URL`, `LLAMA_OPENAI_COMPAT_API_KEY`, `LLAMA_OPENAI_COMPAT_MODEL` (or use `GROQ_*` / `TOGETHER_*`)

Then start the dev server.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Adding Custom Documents for Study Tracks

To add your own PDF, EPUB, TXT, or MD files to the study tracks:

1. Place your files in the corresponding folder under `documents/raw/`:
   - `dogmatic/`: For Dogmatic Theology
   - `biblical/`: For Biblical Theology
   - `history/`: For Church History
   - `general/`: For General Custom Library
   - `bible_study/`: For Bible Study Plans

2. Run the ingestion script:
   ```bash
   npm run ingest
   ```

3. Restart the development server (`npm run dev`) if it was running, to ensure the new JSON files are loaded.

