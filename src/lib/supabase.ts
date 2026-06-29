import { createClient } from '@supabase/supabase-js'
// Node.js < 22 n'a pas WebSocket natif — requis par @supabase/realtime-js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ws = require('ws')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_KEY sont requis')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(url, key, {
  realtime: { transport: ws as any },
})
