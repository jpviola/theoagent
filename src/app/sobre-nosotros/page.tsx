import Link from 'next/link';
import { ArrowRight, Heart, Users, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Sobre nosotros | SantaPalabra',
  description: 'Conoce la misión, visión y el equipo detrás de SantaPalabra.',
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-yellow-50 text-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Sobre nosotros</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">SantaPalabra, catequesis hecha con cariño</h1>
          <p className="mt-4 text-lg text-gray-700 md:text-xl dark:text-gray-300">
            Unimos Escritura, Tradición, Magisterio y la espiritualidad latinoamericana para acompañarte en tu camino de fe.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-md border border-yellow-100 dark:bg-gray-800 dark:border-amber-700">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold">Nuestra misión</h2>
            </div>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed dark:text-gray-300">
              Acompañar a la comunidad hispanoamericana con respuestas fieles al Magisterio, con un tono cercano y pastoral.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-yellow-100 dark:bg-gray-800 dark:border-amber-700">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold">Cómo lo hacemos</h2>
            </div>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed dark:text-gray-300">
              Combinamos fuentes confiables: Biblia, Catecismo, documentos del CELAM y la tradición mística hispana, apoyados por IA responsable.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md border border-yellow-100 dark:bg-gray-800 dark:border-amber-700">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold">Para quién</h2>
            </div>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed dark:text-gray-300">
              Catequistas, sacerdotes, agentes pastorales, estudiantes y cualquier persona que busque claridad y profundidad en la fe.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 shadow-md border border-yellow-100 dark:bg-gray-800 dark:border-amber-700">
            <h3 className="text-xl font-bold text-amber-700">Principios editoriales</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li>• Fidelidad al Catecismo y al Magisterio.</li>
              <li>• Citamos fuentes; evitamos opiniones sin sustento.</li>
              <li>• Lenguaje caritativo, claro y sin jergas técnicas innecesarias.</li>
              <li>• Transparencia: decimos cuándo algo no está definido por la Iglesia.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-md border border-yellow-100 dark:bg-gray-800 dark:border-amber-700">
            <h3 className="text-xl font-bold text-amber-700">Colabora con la misión</h3>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed dark:text-gray-300">
              SantaPalabra crece gracias a la comunidad. Tu apoyo mantiene vivo el proyecto y nos permite sumar nuevas fuentes y funcionalidades.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105"
              >
                Apoyar el proyecto
              </Link>
              <Link
                href="/catholic-chat"
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-5 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                Probar el chat <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
