// @ts-nocheck
import crypto from 'crypto'
import { supabase } from './supabase'

type Row = Record<string, unknown>

// ─── Score completude (réplique du pre-save Mongoose) ─────────────────────────
function computeScore(data: Row): number {
  const champs = ['nom', 'email', 'depart', 'destination', 'date_depart', 'nb_passagers', 'type_trajet', 'urgence']
  const bonus  = ['societe', 'date_retour', 'commentaire']
  const base   = champs.filter(c => !!data[c]).length / champs.length * 80
  const extra  = bonus.filter(c  => !!data[c]).length / bonus.length  * 20
  return Math.round(base + extra)
}

// ─── Mappers Lead ─────────────────────────────────────────────────────────────
function rowToLead(r: Row) {
  return {
    ...r,
    _id:          r.id as string,
    id:           r.id as string,
    userId:       r.user_id    ?? undefined,
    trackingToken: r.tracking_token ?? '',
    createdAt:    r.created_at ? new Date(r.created_at) : new Date(),
    updatedAt:    r.updated_at ? new Date(r.updated_at) : new Date(),
  }
}

function leadToRow(data: Row): Row {
  const row: Row = {}
  const skip = new Set(['_id', 'id', 'userId', 'trackingToken', 'createdAt', 'updatedAt'])
  for (const [k, v] of Object.entries(data)) {
    if (!skip.has(k)) row[k] = v
  }
  if ('userId' in data)       row.user_id       = data.userId       ?? null
  if ('trackingToken' in data) row.tracking_token = data.trackingToken ?? null
  return row
}

// ─── LEAD DB ──────────────────────────────────────────────────────────────────
export const LeadDB = {
  async findById(id: string) {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToLead(data) : null
  },

  async findOne(filter: Row) {
    let q = supabase.from('leads').select('*')
    for (const [k, v] of Object.entries(filter)) {
      q = v === null ? q.is(k, null) : q.eq(k, v)
    }
    const { data, error } = await (q as ReturnType<typeof supabase.from>).limit(1).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToLead(data) : null
  },

  async find(filter: Row, opts?: { sort?: string }) {
    let q = supabase.from('leads').select('*')
    for (const [k, v] of Object.entries(filter)) {
      q = v === null ? q.is(k, null) : q.eq(k, v)
    }
    if (opts?.sort) q = q.order(opts.sort, { ascending: false })
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data || []).map(rowToLead)
  },

  async create(data: Row) {
    const row = leadToRow(data)
    if (!row.tracking_token) row.tracking_token = crypto.randomBytes(20).toString('hex')
    const score = computeScore({ ...data, ...row })
    row.score_completude = score
    if (!row.statut) row.statut = score < 60 ? 'incomplet' : 'nouveau'
    if (!row.urgence) row.urgence = 'normal'
    if (!row.options) row.options = []
    const { data: inserted, error } = await supabase.from('leads').insert(row).select().single()
    if (error) throw new Error(error.message)
    return rowToLead(inserted)
  },

  async findByIdAndUpdate(id: string, updates: Row) {
    const src = updates.$set ? (updates.$set as Row) : updates
    const row = leadToRow(src)
    const { data, error } = await supabase.from('leads').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data ? rowToLead(data) : null
  },

  async updateMany(filter: Row, update: Row) {
    const src = update.$set ? (update.$set as Row) : update
    const row = leadToRow(src)
    let q = supabase.from('leads').update(row)
    for (const [k, v] of Object.entries(filter)) {
      q = v === null ? q.is(k, null) : q.eq(k, v)
    }
    const { data, error } = await (q as ReturnType<typeof supabase.from>).select('id')
    if (error) throw new Error(error.message)
    return { modifiedCount: (data as Row[] | null)?.length ?? 0 }
  },
}

// ─── Mappers Quote ────────────────────────────────────────────────────────────
function rowToQuote(r: Row) {
  return {
    ...r,
    _id:           r.id as string,
    id:            r.id as string,
    leadId:        r.lead_id,
    lastReminderAt: r.last_reminder_at ? new Date(r.last_reminder_at) : undefined,
    modifiedBy:    r.modified_by ?? undefined,
    modifiedAt:    r.modified_at ? new Date(r.modified_at) : undefined,
    email_sent_at: r.email_sent_at ? new Date(r.email_sent_at) : undefined,
    createdAt:     r.created_at ? new Date(r.created_at) : new Date(),
    updatedAt:     r.updated_at ? new Date(r.updated_at) : new Date(),
  }
}

function quoteToRow(data: Row): Row {
  const row: Row = {}
  const skip = new Set(['_id', 'id', 'leadId', 'lastReminderAt', 'modifiedBy', 'modifiedAt', 'createdAt', 'updatedAt'])
  for (const [k, v] of Object.entries(data)) {
    if (!skip.has(k)) row[k] = v
  }
  if ('leadId'        in data) row.lead_id        = data.leadId        ?? null
  if ('lastReminderAt' in data) row.last_reminder_at = data.lastReminderAt instanceof Date ? data.lastReminderAt.toISOString() : data.lastReminderAt ?? null
  if ('modifiedBy'    in data) row.modified_by    = data.modifiedBy    ?? null
  if ('modifiedAt'    in data) row.modified_at    = data.modifiedAt instanceof Date ? data.modifiedAt.toISOString() : data.modifiedAt ?? null
  return row
}

// ─── QUOTE DB ─────────────────────────────────────────────────────────────────
export const QuoteDB = {
  async findById(id: string) {
    const { data, error } = await supabase.from('quotes').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToQuote(data) : null
  },

  async findOne(filter: Row) {
    let q = supabase.from('quotes').select('*')
    for (const [k, v] of Object.entries(filter)) {
      q = v === null ? q.is(k, null) : q.eq(k, v)
    }
    const { data, error } = await (q as ReturnType<typeof supabase.from>).limit(1).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToQuote(data) : null
  },

  async find(filter: Row) {
    let q = supabase.from('quotes').select('*')
    for (const [k, v] of Object.entries(filter)) {
      q = v === null ? q.is(k, null) : q.eq(k, v)
    }
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data || []).map(rowToQuote)
  },

  async findDueReminders() {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('statut_devis', 'sent')
      .lt('reminder_count', 2)
    if (error) throw new Error(error.message)
    return (data || []).map(rowToQuote)
  },

  async findByLeadIds(leadIds: string[]) {
    const { data, error } = await supabase.from('leads').select('*').in('id', leadIds)
    if (error) throw new Error(error.message)
    return (data || []).map(rowToLead)
  },

  async create(data: Row) {
    const row = quoteToRow(data)
    if (!row.statut_devis) row.statut_devis = 'genere'
    if (!row.validite_jours) row.validite_jours = 30
    if (!row.reminder_count) row.reminder_count = 0
    if (!row.ajustement_manuel_ht) row.ajustement_manuel_ht = 0
    if (!row.lignes_calcul) row.lignes_calcul = []
    if (!row.coefficients) row.coefficients = {}
    if (!row.warnings) row.warnings = []
    if (!row.sources_calcul) row.sources_calcul = []
    const { data: inserted, error } = await supabase.from('quotes').insert(row).select().single()
    if (error) throw new Error(error.message)
    return rowToQuote(inserted)
  },

  async update(id: string, updates: Row) {
    const row = quoteToRow(updates)
    const { data, error } = await supabase.from('quotes').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data ? rowToQuote(data) : null
  },

  async findByIdAndUpdate(id: string, updates: Row) {
    return this.update(id, updates)
  },

  async deleteByLeadId(leadId: string) {
    const { error } = await supabase.from('quotes').delete().eq('lead_id', leadId)
    if (error) throw new Error(error.message)
  },
}

// ─── Mappers User ─────────────────────────────────────────────────────────────
function rowToUser(r: Row) {
  return {
    ...r,
    _id:                  r.id as string,
    id:                   r.id as string,
    passwordHash:         r.password_hash,
    emailVerified:        r.email_verified,
    resetPasswordToken:   r.reset_password_token ?? undefined,
    resetPasswordExpires: r.reset_password_expires ? new Date(r.reset_password_expires) : undefined,
    createdAt:            r.created_at ? new Date(r.created_at) : new Date(),
    updatedAt:            r.updated_at ? new Date(r.updated_at) : new Date(),
  }
}

function userToRow(data: Row): Row {
  const row: Row = {}
  const skip = new Set(['_id', 'id', 'passwordHash', 'emailVerified', 'resetPasswordToken', 'resetPasswordExpires', 'createdAt', 'updatedAt'])
  for (const [k, v] of Object.entries(data)) {
    if (!skip.has(k)) row[k] = v
  }
  if ('passwordHash'         in data) row.password_hash         = data.passwordHash
  if ('emailVerified'        in data) row.email_verified        = data.emailVerified
  if ('resetPasswordToken'   in data) row.reset_password_token   = data.resetPasswordToken   ?? null
  if ('resetPasswordExpires' in data) row.reset_password_expires = data.resetPasswordExpires instanceof Date ? data.resetPasswordExpires.toISOString() : data.resetPasswordExpires ?? null
  return row
}

// ─── USER DB ──────────────────────────────────────────────────────────────────
export const UserDB = {
  async findById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToUser(data) : null
  },

  async findOne(filter: Row) {
    let q = supabase.from('users').select('*')
    for (const [k, v] of Object.entries(filter)) {
      if (v !== null && typeof v === 'object' && '$gt' in v) {
        q = q.gt(k, (v as Row).$gt instanceof Date ? (v as Row).$gt.toISOString() : (v as Row).$gt)
      } else if (v !== null && typeof v === 'object' && '$in' in v) {
        q = q.in(k, (v as Row).$in)
      } else {
        q = v === null ? q.is(k, null) : q.eq(k, v)
      }
    }
    const { data, error } = await (q as ReturnType<typeof supabase.from>).limit(1).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToUser(data) : null
  },

  async findOneExcludeId(filter: Row, excludeId: string) {
    let q = supabase.from('users').select('*').neq('id', excludeId)
    for (const [k, v] of Object.entries(filter)) {
      q = q.eq(k, v)
    }
    const { data, error } = await (q as ReturnType<typeof supabase.from>).limit(1).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? rowToUser(data) : null
  },

  async create(data: Row) {
    const row = userToRow(data)
    if (row.email_verified === undefined) row.email_verified = false
    const { data: inserted, error } = await supabase.from('users').insert(row).select().single()
    if (error) throw new Error(error.message)
    return rowToUser(inserted)
  },

  async update(id: string, updates: Row) {
    const row = userToRow(updates)
    const { data, error } = await supabase.from('users').update(row).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data ? rowToUser(data) : null
  },

  async findByIdAndUpdate(id: string, updates: Row) {
    const src = updates.$set ? (updates.$set as Row) : updates
    return this.update(id, src)
  },
}

// ─── Mapper Log ───────────────────────────────────────────────────────────────
function rowToLog(r: Row) {
  return {
    ...r,
    _id:    r.id as string,
    id:     r.id as string,
    leadId: r.lead_id ?? undefined,
  }
}

function logToRow(data: Row): Row {
  const row: Row = {}
  const skip = new Set(['_id', 'id', 'leadId'])
  for (const [k, v] of Object.entries(data)) {
    if (!skip.has(k)) row[k] = v
  }
  if ('leadId' in data) row.lead_id = data.leadId ?? null
  return row
}

// ─── LOG DB ───────────────────────────────────────────────────────────────────
export const LogDB = {
  async find(filter: Row, opts?: { sort?: string; limit?: number }) {
    let q = supabase.from('logs').select('*')
    for (const [k, v] of Object.entries(filter)) {
      q = v === null ? q.is(k, null) : q.eq(k, v)
    }
    if (opts?.sort) q = q.order(opts.sort, { ascending: false })
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data || []).map(rowToLog)
  },

  async create(data: Row) {
    const row = logToRow(data)
    if (!row.status) row.status = 'info'
    if (!row.timestamp) row.timestamp = new Date().toISOString()
    const { data: inserted, error } = await supabase.from('logs').insert(row).select().single()
    if (error) {
      console.error('[LogDB.create]', error.message)
      return { _id: '', id: '', ...row }
    }
    return rowToLog(inserted)
  },
}
