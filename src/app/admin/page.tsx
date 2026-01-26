import AdminDashboard from '@/components/AdminDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');

  if (!adminSession) {
    // redirect('/admin/login');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border border-gray-200">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">
            Esta área es exclusiva para administradores del sistema.
          </p>
          <a 
            href="/admin/login" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Iniciar Sesión como Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard />
  );
}
