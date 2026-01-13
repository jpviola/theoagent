import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Apoya a SantaPalabra</h1>
      <p className="mb-4">SantaPalabra es una iniciativa de evangelización digital diseñada para llevar el Evangelio y la enseñanza católica a más personas. Si esta herramienta te ayuda, considera apoyarnos para mantenerla en línea y mejorarla.</p>

      <div className="mb-6">
        <a href="https://www.buymeacoffee.com/santapalabra" target="_blank" rel="noreferrer" className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-md font-semibold">Invítanos un café ☕</a>
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">¿En qué usamos las donaciones?</h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Costos del servicio y modelo de lenguaje (mantenimiento online).</li>
        <li>Desarrollo y mejoras (functions, calidad de respuestas).</li>
        <li>Creación y validación de contenido con asesores católicos.</li>
        <li>Acceso gratuito y soporte para parroquias y comunidades con pocos recursos.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Niveles de apoyo (sugeridos)</h2>
      <ul className="list-none pl-0 mb-6">
        <li className="mb-2"><strong>Amigo — $5</strong>: Gracias pública en la web.</li>
        <li className="mb-2"><strong>Sostenedor — $20</strong>: Reporte trimestral de impacto.</li>
        <li className="mb-2"><strong>Patrono — $100</strong>: Mención destacada y sesión virtual con el equipo.</li>
      </ul>

      <p className="mb-4">Si prefieres, también puedes compartir la página, proponer ideas o invitar a tu parroquia a sumarse.</p>

      <div className="mt-8">
        <Link href="/blog" className="underline">Lee nuestro blog y conoce el proyecto</Link>
      </div>
    </div>
  )
}
