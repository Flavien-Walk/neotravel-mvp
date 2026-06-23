'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle, Clock, RefreshCw, AlertTriangle, ArrowRight,
  MapPin, Users, Calendar, Euro,
} from 'lucide-react'
import { api } from '@/lib/api'
import { TrackingData, LeadStatus, LEAD_STATUS_COLORS } from '@/types'
import Logo from '@/components/brand/Logo'

const STEPS: { statut: LeadStatus; label: string }[] = [
  { statut: 'nouveau',      label: 'Demande reçue'       },
  { statut: 'incomplet',    label: 'Informations'         },
  { statut: 'qualifie',     label: 'Qualification'        },
  { statut: 'devis_genere', label: 'Devis calculé'        },
  { statut: 'devis_envoye', label: 'Devis envoyé'         },
  { statut: 'relance_1',    label: 'Relance'              },
  { statut: 'accepte',      label: 'Accepté'              },
]

function stepIndex(statut: LeadStatus): number {
  const i = STEPS.findIndex(s => s.statut === statut)
  if (i !== -1) return i
  if (['relance_2'].includes(statut)) return 5
  if (['cas_complexe'].includes(statut)) return 3
  if (['refuse', 'cloture'].includes(statut)) return -1
  return 0
}

const STATUS_LABELS: Record<string, string> = {
  nouveau:      'Demande reçue — qualification en cours',
  incomplet:    'Informations complémentaires requises',
  qualifie:     'Dossier qualifié — devis en cours de calcul',
  devis_genere: 'Devis prêt — envoi imminent',
  devis_envoye: 'Devis envoyé — en attente de réponse',
  relance_1:    'Relance envoyée',
  relance_2:    'Deuxième relance envoyée',
  accepte:      'Devis accepté — merci !',
  refuse:       'Devis refusé',
  cas_complexe: 'Dossier transmis à un conseiller NeoTravel',
  cloture:      'Dossier clôturé',
}

export default function SuiviPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData]     = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!token) return
    api.leads.track(token as string)
      .then(d => { setData(d as TrackingData) })
      .catch(() => setError('Demande introuvable. Vérifiez le lien reçu par email.'))
      .finally(() => setLoading(false))
  }, [token])

  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const currentStep = data ? stepIndex(data.statut) : -1

  return (
    <div className="min-h-screen bg-neo-900 flex flex-col items-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 35% at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo size="md" /></Link>
        </div>

        {loading && (
          <div className="card-premium !p-10 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-neo-blue" />
            <p className="text-white/40 text-sm">Récupération de votre dossier…</p>
          </div>
        )}

        {!loading && error && (
          <div className="card-premium !p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h1 className="text-white font-bold text-lg mb-2">Lien invalide</h1>
            <p className="text-white/45 text-sm">{error}</p>
            <Link href="/devis" className="btn-gold mt-6 gap-2 !inline-flex">
              Faire une nouvelle demande
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!loading && data && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Statut principal */}
            <div className="card-premium !p-6 mb-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${LEAD_STATUS_COLORS[data.statut] ?? 'bg-white/5 text-white/50 border border-white/10'}`}>
                {STATUS_LABELS[data.statut] ?? data.statut_label}
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Suivi de votre demande</h1>
              <p className="text-white/40 text-sm">Mis à jour le {new Date(data.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            {/* Trajet */}
            <div className="card-neo mb-4">
              <h2 className="text-xs text-white/35 uppercase tracking-wider mb-4">Votre trajet</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 text-center">
                  <MapPin className="w-4 h-4 text-neo-blue mx-auto mb-1" />
                  <div className="font-bold text-white text-sm">{data.trajet.split(' → ')[0]}</div>
                  <div className="text-white/30 text-[10px]">Départ</div>
                </div>
                <div className="text-white/25 text-sm font-mono">→</div>
                <div className="flex-1 text-center">
                  <MapPin className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                  <div className="font-bold text-white text-sm">{data.trajet.split(' → ')[1]}</div>
                  <div className="text-white/30 text-[10px]">Destination</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/60">{new Date(data.date_depart).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/60">{data.nb_passagers} passagers</span>
                </div>
              </div>
            </div>

            {/* Progression */}
            {!['refuse', 'cloture'].includes(data.statut) && currentStep >= 0 && (
              <div className="card-neo mb-4">
                <h2 className="text-xs text-white/35 uppercase tracking-wider mb-4">Avancement</h2>
                <div className="relative">
                  {/* Barre de fond */}
                  <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-white/8" />
                  {/* Barre de progression */}
                  <div
                    className="absolute top-3.5 left-4 h-0.5 bg-neo-blue transition-all duration-700"
                    style={{ width: `${Math.max(0, (currentStep / (STEPS.length - 1)) * (100 - (8 / (STEPS.length - 1))))}%` }}
                  />
                  <div className="flex justify-between relative">
                    {STEPS.map((step, i) => {
                      const done   = i < currentStep
                      const active = i === currentStep
                      return (
                        <div key={step.statut} className="flex flex-col items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                            done   ? 'bg-green-500 border-green-500'  :
                            active ? 'bg-neo-blue border-neo-blue'    :
                                     'bg-neo-900 border-white/15'
                          }`}>
                            {done
                              ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                              : active
                              ? <div className="w-2 h-2 rounded-full bg-white" />
                              : <div className="w-2 h-2 rounded-full bg-white/20" />}
                          </div>
                          <span className={`text-[9px] text-center leading-tight max-w-[52px] ${
                            active ? 'text-neo-blue font-semibold' : done ? 'text-green-400' : 'text-white/20'
                          }`}>{step.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Devis */}
            {data.devis && ['devis_envoye', 'relance_1', 'relance_2', 'accepte'].includes(data.statut) && (
              <div className="card-neo mb-4">
                <h2 className="text-xs text-white/35 uppercase tracking-wider mb-4">Votre devis</h2>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Euro className="w-5 h-5 text-neo-gold" />
                    <span className="text-3xl font-bold text-white">{fmt(data.devis.prix_ttc)}</span>
                  </div>
                  <div className="text-white/35 text-sm">TTC · TVA 10 % incluse</div>
                  {data.devis.warnings?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {data.devis.warnings.map((w, i) => (
                        <div key={i} className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                  {data.devis.besoin_reprise_humaine && (
                    <div className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                      Un conseiller NeoTravel suit ce dossier personnellement.
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-white/20 text-center mt-3">
                  Envoyé le {new Date(data.devis.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {/* Statuts spéciaux */}
            {data.statut === 'cas_complexe' && (
              <div className="card-neo mb-4 bg-rose-500/8 border border-rose-500/20">
                <p className="text-rose-300 text-sm">
                  Votre dossier nécessite une attention particulière. Un conseiller NeoTravel le prend en charge et vous contactera directement.
                </p>
              </div>
            )}
            {data.statut === 'accepte' && (
              <div className="card-neo mb-4 bg-green-500/8 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-green-300 text-sm font-medium">Devis accepté ! Notre équipe prend en charge votre réservation.</p>
              </div>
            )}

            {/* Informations */}
            <div className="glass rounded-2xl px-5 py-4 mt-4 text-sm text-white/40 space-y-1">
              <p>Demande créée le {new Date(data.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>Pour toute question : <a href="mailto:commercial@neotravel.fr" className="text-neo-blue hover:underline">commercial@neotravel.fr</a></p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <Link href="/" className="text-xs text-white/25 hover:text-white/45 transition-colors">← Accueil</Link>
              <Link href="/devis" className="text-xs text-neo-blue hover:underline">Nouvelle demande →</Link>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-[10px] text-white/30">
                <Clock className="w-3 h-3" />
                Suivi en temps réel · Aucune connexion requise
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
