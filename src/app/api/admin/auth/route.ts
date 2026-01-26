import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Credenciales hardcodeadas (como solicitado por el usuario)
    // Nota: En producción real, usar variables de entorno
    const VALID_USERNAME = 'jpviola';
    const VALID_PASSWORD = 'palaBraSantA$060522@)';

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      // Establecer cookie de sesión de administrador
      (await cookies()).set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 semana
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Usuario o contraseña incorrectos.' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
