import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Blog — SantaPalabra</h1>
      <p className="mb-6">Historias, novedades y el recorrido de nuestro proyecto de evangelización digital. Aquí compartimos por qué lo hacemos y cómo puedes colaborar.</p>

      <article className="mb-8 border rounded-md p-4">
        <h2 className="text-2xl font-semibold">Por qué construimos SantaPalabra</h2>
        <p className="mt-2">Queremos que la Palabra llegue a donde las personas están: en sus casas, en su trabajo y en su celular. SantaPalabra sirve como acompañante y guía —una herramienta que apoya a catequistas, párrocos y fieles— sin reemplazar la presencia humana.</p>
        <div className="mt-3 text-sm text-gray-600">Publicado: Enero 2026</div>
        <div className="mt-4">
          <Link href="/support" className="text-yellow-600 underline">Apoya el proyecto</Link>
        </div>
      </article>

      <section>
        <h3 className="text-xl font-semibold mb-2">Publicaciones recientes</h3>
        <ul className="list-disc pl-6">
          <li>Cómo usamos la tecnología para acompañar la fe</li>
          <li>Historias de parroquias que ya prueban la app</li>
        </ul>
      </section>
    </div>
  )
}
