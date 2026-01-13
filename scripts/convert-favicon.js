const fs = require('fs');
const path = require('path');

// Crear un ICO manualmente con los PNG que tenemos
// ICO format es complejo, por ahora copiemos el PNG de 32x32 como favicon.ico

const source = path.join(__dirname, '..', 'public', 'favicon-32x32.png');
const dest = path.join(__dirname, '..', 'public', 'favicon.ico');

fs.copyFileSync(source, dest);
console.log('✅ Favicon.ico creado desde favicon-32x32.png');
