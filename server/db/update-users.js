import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para actualizar SOLO la tabla users
 * Mantiene intacta la tabla de reportes
 * 
 * Uso:
 * 1. Crea/edita el archivo users.json con formato:
 *    [
 *      { "email": "user@apprecio.com", "password": "pass123", "nombre": "Nombre Completo" }
 *    ]
 * 2. Ejecuta: DATABASE_URL="postgresql://..." node server/db/update-users.js
 * 
 * IMPORTANTE: Las contraseñas se guardarán cifradas automáticamente con bcrypt
 */
async function updateUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Actualizando usuarios...');
    console.log('⚠️  Los reportes NO serán afectados');
    
    // Verificar si existe el archivo users.json
    const usersPath = path.join(__dirname, 'users.json');
    
    if (!fs.existsSync(usersPath)) {
      console.log('📝 Creando archivo de ejemplo users.json...');
      const ejemplo = [
        {
          "email": "imolina@apprecio.com",
          "password": "admin123",
          "nombre": "Ignacio Molina"
        },
        {
          "email": "srodriguez@apprecio.com",
          "password": "marca123",
          "nombre": "Sandra Rodriguez"
        }
      ];
      fs.writeFileSync(usersPath, JSON.stringify(ejemplo, null, 2));
      console.log('✅ Archivo users.json creado en server/db/users.json');
      console.log('📋 Edita el archivo con tus usuarios y vuelve a ejecutar este script');
      process.exit(0);
    }
    
    // Cargar usuarios desde JSON
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    
    if (!Array.isArray(usersData) || usersData.length === 0) {
      throw new Error('❌ El archivo users.json debe contener un array con al menos un usuario');
    }
    
    // Validar estructura de datos
    for (const user of usersData) {
      if (!user.email || !user.password || !user.nombre) {
        throw new Error('❌ Cada usuario debe tener: email, password y nombre');
      }
    }
    
    console.log(`📝 Procesando ${usersData.length} usuarios...`);
    
    // Eliminar todos los usuarios existentes
    await client.query('DELETE FROM users');
    console.log('✅ Usuarios antiguos eliminados');
    
    // Insertar cada usuario con password hasheado
    let count = 0;
    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await client.query(`
        INSERT INTO users (email, password, nombre)
        VALUES ($1, $2, $3)
      `, [user.email, hashedPassword, user.nombre]);
      
      console.log(`  ✓ ${user.email} - Password: ${user.password}`);
      count++;
    }
    
    console.log(`\n✅ ${count} usuarios insertados exitosamente`);
    console.log('🔐 Todas las contraseñas fueron cifradas con bcrypt');
    console.log('🎉 Actualización de usuarios completada!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar usuarios:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

updateUsers();
