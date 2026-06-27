import { supabase } from '../lib/supabase'

export async function connectDB(): Promise<void> {
  const { error } = await supabase.from('leads').select('id').limit(1)
  if (error) {
    console.error('Supabase connection error:', error.message)
    throw new Error(error.message)
  }
  console.log('Supabase connecté ✓')
}
