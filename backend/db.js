import 'dotenv/config'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'


const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require', // Refuerza la seguridad
  connect_timeout: 10 // Si no conecta en 10s, que aborte
})
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
)
export {sql, supabase}