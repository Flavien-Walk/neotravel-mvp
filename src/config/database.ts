import { supabase } from '../lib/supabase'

export async function connectDB(): Promise<void> {
  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error) throw new Error(`Supabase connexion échouée : ${error.message}`)
  console.log('Supabase connecté')
}
