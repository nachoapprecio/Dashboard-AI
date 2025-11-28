import bcrypt from 'bcrypt';
import pool from '../config/db.js';

// Ejecutar: node server/db/add-user.js email@example.com "password" "Nombre Completo"

async function addUser() {
  const [email, password, nombre] = process.argv.slice(2);
  
  if (!email || !password || !nombre) {
    console.error('❌ Uso: node server/db/add-user.js email@example.com "password" "Nombre Completo"');
    process.exit(1);
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, nombre) VALUES ($1, $2, $3) RETURNING id, email, nombre',
      [email, hashedPassword, nombre]
    );
    
    console.log('✅ Usuario creado exitosamente:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Nombre: ${result.rows[0].nombre}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    if (error.code === '23505') {
      console.error('❌ Error: El email ya existe en la base de datos');
    } else {
      console.error('❌ Error al crear usuario:', error.message);
    }
    process.exit(1);
  }
}

addUser();
