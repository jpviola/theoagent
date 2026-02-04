import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <div className="max-w-4xl mx-auto py-12 px-6">
      <header className="mb-8 text-gray-900 dark:text-gray-100">
        <h1 className="text-4xl font-bold">Blog — SantaPalabra</h1>
        <p className="mt-2">Novedades, historias y el propósito detrás de nuestra herramienta de evangelización digital. Comparte, apoya y acompaña este proyecto.</p>
      </header>

      <article className="rounded-2xl shadow-md p-6 mb-8 border border-amber-200 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
        <h2 className="text-2xl font-semibold text-amber-700 dark:text-amber-500">Por qué construimos SantaPalabra</h2>
        <p className="mt-4">En muchas comunidades la formación religiosa no siempre está al alcance. Las personas buscan respuestas rápidas y confiables sobre la fe en sus teléfonos. SantaPalabra nace para ofrecer una ayuda fiel, cercana y accesible, que complemente el trabajo de catequistas y sacerdotes.</p>

        <h3 className="mt-4 font-semibold text-amber-700 dark:text-amber-500">Nuestra misión</h3>
        <p className="mt-2">Crear una herramienta sencilla que facilite la comprensión del Evangelio, acompañe la oración diaria y ofrezca recursos prácticos para la pastoral.</p>

        <h3 className="mt-4 font-semibold text-amber-700 dark:text-amber-500">Cómo nos puedes ayudar</h3>
        <ul className="list-disc pl-6 mt-2">
          <li>Donando para cubrir los costos de operación.</li>
          <li>Compartiendo la app con tu parroquia o comunidad.</li>
          <li>Colaborando en la creación de contenidos y validación.</li>
        </ul>

        <div className="mt-6">
          <Link href="/support" className="inline-block px-5 py-2 rounded-md font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-md hover:shadow-lg">Apoya el proyecto</Link>
        </div>

        <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">Publicado: Enero 2026</div>
      </article>

      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Historias de impacto</h3>
        <div className="space-y-4">
          <div className="rounded-2xl p-4 shadow-md border border-amber-200 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <strong className="text-amber-700 dark:text-amber-500">Parroquia San Martín</strong>
            <p className="text-sm mt-1">Usaron SantaPalabra para apoyar la catequesis de confirmación en un barrio rural. Resultó en más participación y preguntas profundas de los jóvenes.</p>
          </div>
          <div className="rounded-2xl p-4 shadow-md border border-amber-200 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <strong className="text-amber-700 dark:text-amber-500">Grupo Juvenil Nueva Luz</strong>
            <p className="text-sm mt-1">Los líderes encontraron en la app una ayuda para preparar temas y dinámicas en sus reuniones.</p>
          </div>
        </div>
      </section>

      <aside className="rounded-2xl p-6 shadow-md border border-amber-200 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
        <h4 className="font-semibold text-amber-700 dark:text-amber-500">¿Quieres colaborar como redactor o asesor?</h4>
        <p className="mt-2">Escríbenos y estaremos encantados de conversar sobre cómo colaborar.</p>
        <div className="mt-4">
          <Link href="/support" className="underline text-amber-600 hover:text-amber-700 font-medium">Ir a la página de apoyo</Link>
        </div>
      </aside>
      </div>
    </div>
  )
}
