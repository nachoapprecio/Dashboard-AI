# Railway Start Script
echo "🚀 Iniciando aplicación..."
echo "📦 Ejecutando migraciones de base de datos..."
npm run seed
echo "✅ Base de datos lista"
echo "🌐 Iniciando servidor..."
npm start
