const sharp = require('sharp');
const path = require('path');

async function createFavicons() {
  // SVG base con el logo de SantaPalabra
  const svgBuffer = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#FFD700"/>
          <stop offset="1" stop-color="#F4C430"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#g)"/>
      <path d="M22 40c0-10 8-18 18-18h6v6h-6c-6.6 0-12 5.4-12 12v2h-6v-2Z" fill="#1A1A1A"/>
      <path d="M22 28v-6h20c8.8 0 16 7.2 16 16v4h-6v-4c0-5.5-4.5-10-10-10H22Z" fill="#1A1A1A" opacity=".85"/>
    </svg>
  `);

  try {
    // Generar PNG de 16x16
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-16x16.png'));
    
    console.log('✅ favicon-16x16.png creado');

    // Generar PNG de 32x32
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-32x32.png'));
    
    console.log('✅ favicon-32x32.png creado');

    // Generar PNG de 48x48 para ICO
    await sharp(svgBuffer)
      .resize(48, 48)
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-48x48.png'));
    
    console.log('✅ favicon-48x48.png creado');

    // Usar el 32x32 como .ico para compatibilidad básica
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFormat('png')
      .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
    
    console.log('✅ favicon.ico creado');
    console.log('\n🎉 Todos los favicons creados exitosamente');
    console.log('💡 Reinicia el servidor con: npm run dev');
    console.log('💡 Limpia el caché del navegador: Ctrl+Shift+Delete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createFavicons();
