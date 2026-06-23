/**
 * calculer_devis() — Fonction déterministe de calcul de devis transport.
 *
 * RÈGLE ABSOLUE : Cette fonction ne dépend d'aucun LLM.
 * "L'agent collecte et orchestre, le code calcule."
 *
 * Toutes les hypothèses tarifaires sont marquées [MOCK MVP].
 */

export interface DevisInput {
  depart: string
  destination: string
  date_depart: string
  date_retour?: string
  nb_passagers: number
  type_trajet: string
  options?: string[]
  urgence?: string
}

export interface LigneCalcul {
  label: string
  montant: number
  detail?: string
}

export interface DevisResult {
  success: true
  prix_ht: number
  tva: number
  prix_ttc: number
  lignes_calcul: LigneCalcul[]
  coefficients: Record<string, number>
  warnings: string[]
  besoin_reprise_humaine: boolean
  raison_reprise_humaine: string | null
}

export interface DevisError {
  success: false
  error: string
  besoin_reprise_humaine: boolean
  raison_reprise_humaine: string | null
}

// ─── Table de distances mockées [MOCK MVP] ───────────────────────────────────
// Source : distances routières approximatives en km, sans API Maps.
// Clé : "{ville_a}|{ville_b}" en minuscules, normalisées.
const DISTANCES_KM: Record<string, number> = {
  'paris|lyon':         465,
  'paris|marseille':    775,
  'paris|bordeaux':     585,
  'paris|toulouse':     680,
  'paris|lille':        225,
  'paris|nantes':       385,
  'paris|strasbourg':   490,
  'paris|rennes':       350,
  'paris|nice':         930,
  'lyon|marseille':     315,
  'lyon|bordeaux':      555,
  'lyon|toulouse':      430,
  'lyon|lille':         670,
  'lyon|nice':          300,
  'marseille|toulouse': 405,
  'marseille|bordeaux': 640,
  'marseille|nice':     200,
  'bordeaux|toulouse':  245,
  'bordeaux|nantes':    345,
  'toulouse|nice':      600,
  'lille|rennes':       530,
  'nantes|rennes':      110,
  'strasbourg|lyon':    490,
}

// ─── Constantes tarifaires [MOCK MVP] ─────────────────────────────────────────
const TARIF_KM              = 2.50  // €/km — coût de base d'un car standard
const FRAIS_MISE_EN_ROUTE   = 80    // € — forfait fixe par trajet
const TVA_TAUX              = 0.10  // 10% — taux TVA transport voyageurs France

const COEFF_URGENCE: Record<string, number> = {
  normal:      1.00,
  urgent:      1.15,
  tres_urgent: 1.30,
}

const COEFF_ALLER_RETOUR  = 1.80  // Pas x2 — optimisation retour à vide partiel
const COEFF_CIRCUIT       = 2.20  // Circuit multi-étapes

const OPTIONS_PRIX: Record<string, number | ((nb: number) => number)> = {
  wifi:         150,
  hostesse:     250,
  repas:        (nb: number) => nb * 15,  // 15 € / passager
  climatisation: 0,  // Standard, inclus
}

// ─── Normalisation des noms de villes ────────────────────────────────────────
function normaliser(ville: string): string {
  return ville
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // Retire accents
    .replace(/[^a-z0-9]/g, '')        // Retire caractères spéciaux
    .trim()
}

function getDistance(depart: string, destination: string): number | null {
  const a = normaliser(depart)
  const b = normaliser(destination)
  return DISTANCES_KM[`${a}|${b}`] ?? DISTANCES_KM[`${b}|${a}`] ?? null
}

// ─── Validation ──────────────────────────────────────────────────────────────
function valider(input: DevisInput): string | null {
  if (!input.depart?.trim())       return 'Ville de départ manquante.'
  if (!input.destination?.trim())  return 'Ville de destination manquante.'
  if (!input.date_depart)          return 'Date de départ manquante.'
  if (input.nb_passagers === undefined || input.nb_passagers === null) return 'Nombre de passagers manquant.'
  if (input.nb_passagers === 0)    return 'Le nombre de passagers ne peut pas être 0.'
  if (input.nb_passagers < 1)      return 'Le nombre de passagers doit être un entier positif.'

  if (input.date_retour) {
    const dep = new Date(input.date_depart)
    const ret = new Date(input.date_retour)
    if (isNaN(dep.getTime())) return 'Date de départ invalide.'
    if (isNaN(ret.getTime())) return 'Date de retour invalide.'
    if (ret < dep)            return 'La date de retour est antérieure à la date de départ.'
  }

  return null
}

// ─── Fonction principale ──────────────────────────────────────────────────────
export function calculer_devis(input: DevisInput): DevisResult | DevisError {
  // 1. Validation
  const errValidation = valider(input)
  if (errValidation) {
    return { success: false, error: errValidation, besoin_reprise_humaine: false, raison_reprise_humaine: null }
  }

  // 2. Distance
  const distanceKm = getDistance(input.depart, input.destination)
  if (distanceKm === null) {
    return {
      success: false,
      error: `Trajet "${input.depart} → ${input.destination}" hors zone ou distance à valider. Ce cas nécessite une reprise humaine.`,
      besoin_reprise_humaine: true,
      raison_reprise_humaine: `Distance inconnue pour "${input.depart} → ${input.destination}"`,
    }
  }

  const warnings: string[] = []
  let besoin_reprise_humaine = false
  let raison_reprise_humaine: string | null = null

  // Détection reprise humaine
  if (input.nb_passagers > 85) {
    besoin_reprise_humaine = true
    raison_reprise_humaine = `Groupe de ${input.nb_passagers} passagers dépasse la capacité standard (85). Contactez-nous pour les grands groupes.`
  }
  if (input.type_trajet === 'circuit') {
    besoin_reprise_humaine = true
    raison_reprise_humaine = raison_reprise_humaine ?? 'Circuit multi-étapes — validation humaine recommandée'
  }
  if (input.urgence === 'tres_urgent') {
    warnings.push('Demande très urgente — le prix inclut une majoration de 30%.')
  }
  if (input.nb_passagers > 50) {
    warnings.push('Grand groupe (>50 pax) — vérification capacité autocar recommandée.')
  }
  if (input.options?.includes('hostesse')) {
    warnings.push('Hôtesse : disponibilité à confirmer selon le prestataire.')
  }

  // 3. Calcul ligne par ligne
  const lignes: LigneCalcul[] = []
  const coefficients: Record<string, number> = {}

  // — Base kilométrique [MOCK MVP : ${TARIF_KM}€/km]
  const baseKm = distanceKm * TARIF_KM
  lignes.push({
    label: 'Transport kilométrique',
    montant: baseKm,
    detail: `${distanceKm} km × ${TARIF_KM} €/km`,
  })

  // — Frais de mise en route [MOCK MVP]
  lignes.push({
    label: 'Frais de mise en route',
    montant: FRAIS_MISE_EN_ROUTE,
    detail: 'Forfait fixe',
  })

  // — Coefficient type de trajet
  let coeffTrajet = 1.0
  const typeTrajet = input.type_trajet || 'aller_simple'
  if (typeTrajet === 'aller_retour') {
    coeffTrajet = COEFF_ALLER_RETOUR
    coefficients['aller_retour'] = coeffTrajet
    const surplusAR = (baseKm + FRAIS_MISE_EN_ROUTE) * (COEFF_ALLER_RETOUR - 1)
    lignes.push({
      label: 'Supplément aller-retour',
      montant: surplusAR,
      detail: `Coefficient ×${COEFF_ALLER_RETOUR} (retour à vide optimisé)`,
    })
  } else if (typeTrajet === 'circuit') {
    coeffTrajet = COEFF_CIRCUIT
    coefficients['circuit'] = coeffTrajet
    const surplusCircuit = (baseKm + FRAIS_MISE_EN_ROUTE) * (COEFF_CIRCUIT - 1)
    lignes.push({
      label: 'Supplément circuit multi-étapes',
      montant: surplusCircuit,
      detail: `Coefficient ×${COEFF_CIRCUIT}`,
    })
  }

  // — Coefficient urgence
  const urgenceKey = input.urgence || 'normal'
  const coeffUrg = COEFF_URGENCE[urgenceKey] ?? 1.0
  coefficients['urgence'] = coeffUrg
  if (coeffUrg > 1.0) {
    const sousTotal = baseKm + FRAIS_MISE_EN_ROUTE + (coeffTrajet - 1) * (baseKm + FRAIS_MISE_EN_ROUTE)
    const surplusUrg = sousTotal * (coeffUrg - 1)
    lignes.push({
      label: `Supplément urgence (${urgenceKey})`,
      montant: surplusUrg,
      detail: `Coefficient ×${coeffUrg}`,
    })
  }

  // — Options
  for (const opt of input.options ?? []) {
    const tarif = OPTIONS_PRIX[opt]
    if (tarif === undefined) continue
    const montant = typeof tarif === 'function' ? tarif(input.nb_passagers) : tarif
    if (montant > 0) {
      lignes.push({
        label: `Option : ${opt}`,
        montant,
        detail: typeof tarif === 'function' ? `${montant / input.nb_passagers} €/passager × ${input.nb_passagers}` : `Forfait`,
      })
    }
  }

  // 4. Totaux
  const prix_ht  = Math.round(lignes.reduce((s, l) => s + l.montant, 0) * 100) / 100
  const tva      = Math.round(prix_ht * TVA_TAUX * 100) / 100
  const prix_ttc = Math.round((prix_ht + tva) * 100) / 100

  return {
    success: true,
    prix_ht,
    tva,
    prix_ttc,
    lignes_calcul: lignes,
    coefficients,
    warnings,
    besoin_reprise_humaine,
    raison_reprise_humaine,
  }
}
