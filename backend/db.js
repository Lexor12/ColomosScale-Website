import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require', // Refuerza la seguridad
  connect_timeout: 10 // Si no conecta en 10s, que aborte
})

export default sql