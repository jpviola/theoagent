'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f0f1]">
      <div className="mb-8">
        <Image
          src="/santapalabra-logo.svg"
          alt="SantaPalabra"
          width={80}
          height={80}
          className="rounded-xl shadow-sm"
        />
      </div>
      
      <div className="w-full max-w-[320px] bg-white p-6 shadow-md rounded-sm border border-gray-200">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre de usuario o correo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm transition-colors text-base"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm transition-colors text-base"
            />
          </div>

          {error && (
            <div className="p-3 border-l-4 border-[#d63638] bg-white shadow-sm text-sm text-[#0c0d0e]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded-sm border-gray-300 text-[#2271b1] focus:ring-[#2271b1]" />
              Recuérdame
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-[#2271b1] text-white text-sm font-semibold rounded-sm hover:bg-[#135e96] focus:ring-2 focus:ring-offset-1 focus:ring-[#2271b1] transition-colors disabled:opacity-50"
            >
              {loading ? 'Accediendo...' : 'Acceder'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          <a href="/" className="hover:text-[#2271b1] hover:underline">← Ir a SantaPalabra</a>
        </p>
      </div>
    </div>
  );
}
