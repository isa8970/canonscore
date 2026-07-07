import { createClient } from '@supabase/supabase-js'

// Jalamos las variables de entorno que configuramos en el Paso 3
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Creamos y exportamos una sola instancia del cliente para usarla en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)