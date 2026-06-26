/**
 * calculer_devis() — Fonction déterministe de calcul de devis transport.
 *
 * RÈGLE ABSOLUE : Cette fonction ne dépend d'aucun LLM.
 * "L'agent collecte et orchestre, le code calcule."
 *
 * Toutes les hypothèses tarifaires sont marquées [MOCK MVP].
 * source_type = "mock_mvp" → valeur à remplacer par le barème réel NeoTravel.
 */

export type SourceType = 'mock_mvp' | 'regle_documentee' | 'hypothese_mvp' | 'a_definir'

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
  formule: string
  variables: Record<string, number | string>
  source_regle: string
  source_type: SourceType
  justification: string
}

export interface CalculationSource {
  label: string
  valeur: string | number
  source_type: SourceType
  justification: string
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
  sources_calcul: CalculationSource[]
  explication_calcul: string
}

export interface DevisError {
  success: false
  error: string
  besoin_reprise_humaine: boolean
  raison_reprise_humaine: string | null
  hint?: string
}

// ─── Table de distances [MOCK MVP] ───────────────────────────────────────────
// Source : distances routières approximatives en km, sans API Maps réelle.
// À remplacer par l'API Distance Matrix en production.
const DISTANCES_KM: Record<string, number> = {
  'paris|lyon':           465,
  'paris|marseille':      775,
  'paris|bordeaux':       585,
  'paris|toulouse':       680,
  'paris|lille':          225,
  'paris|nantes':         385,
  'paris|strasbourg':     490,
  'paris|rennes':         350,
  'paris|nice':           930,
  'paris|montpellier':    750,
  'paris|grenoble':       570,
  'paris|dijon':          310,
  'paris|reims':          145,
  'paris|toulon':         840,
  'lyon|marseille':       315,
  'lyon|bordeaux':        555,
  'lyon|toulouse':        430,
  'lyon|lille':           670,
  'lyon|nice':            300,
  'lyon|grenoble':        105,
  'lyon|montpellier':     330,
  'lyon|strasbourg':      490,
  'marseille|toulouse':   405,
  'marseille|bordeaux':   640,
  'marseille|nice':       200,
  'marseille|montpellier': 170,
  'marseille|toulon':      65,
  'bordeaux|toulouse':    245,
  'bordeaux|nantes':      345,
  'bordeaux|rennes':      445,
  'toulouse|nice':        600,
  'toulouse|montpellier': 240,
  'lille|rennes':         530,
  'lille|strasbourg':     530,
  'nantes|rennes':        110,
  'strasbourg|lyon':      490,
  'grenoble|nice':        300,
  'grenoble|marseille':   300,
  'dijon|lyon':           195,
  'reims|lille':          200,
  'reims|strasbourg':     275,
}

// ─── Constantes tarifaires [MOCK MVP] ────────────────────────────────────────
const TARIF_KM             = 2.50   // €/km — coût de base d'un car standard
const FRAIS_MISE_EN_ROUTE  = 80     // € — forfait fixe par trajet
const TVA_TAUX             = 0.10   // 10 % — TVA transport voyageurs France

const COEFF_URGENCE: Record<string, number> = {
  normal:      1.00,
  urgent:      1.15,
  tres_urgent: 1.30,
}

const COEFF_ALLER_RETOUR = 1.80  // Pas ×2 — optimisation retour à vide partiel
const COEFF_CIRCUIT      = 2.20  // Circuit multi-étapes

const OPTIONS_PRIX: Record<string, number | ((nb: number) => number)> = {
  wifi:          150,
  hostesse:      250,
  repas:         (nb: number) => nb * 15,
  climatisation: 0, // Inclus standard
}

// ─── Normalisation villes ─────────────────────────────────────────────────────
function normaliser(ville: string): string {
  return ville
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // supprime les diacritiques combinants
    .replace(/[^a-z0-9]/g, '')       // supprime tout sauf lettres/chiffres
}

function getDistance(depart: string, destination: string): number | null {
  const a = normaliser(depart)
  const b = normaliser(destination)
  if (!a || !b) return null
  return DISTANCES_KM[`${a}|${b}`] ?? DISTANCES_KM[`${b}|${a}`] ?? null
}

// ─── Validation ───────────────────────────────────────────────────────────────
function valider(input: DevisInput): string | null {
  const dep = input.depart?.trim()
  const dst = input.destination?.trim()

  if (!dep)  return 'Ville de départ manquante ou vide.'
  if (!dst)  return 'Ville de destination manquante ou vide.'
  if (dep.toLowerCase() === dst.toLowerCase()) return 'Le départ et la destination ne peuvent pas être identiques.'
  if (!input.date_depart) return 'Date de départ manquante.'

  const nbPax = input.nb_passagers
  if (nbPax === undefined || nbPax === null) return 'Nombre de passagers manquant.'
  if (!Number.isFinite(nbPax) || nbPax < 1)  return 'Le nombre de passagers doit être un entier positif.'

  if (input.date_retour) {
    const dep  = new Date(input.date_depart)
    const ret  = new Date(input.date_retour)
    if (isNaN(dep.getTime())) return 'Date de départ invalide.'
    if (isNaN(ret.getTime())) return 'Date de retour invalide.'
    if (ret < dep)            return 'La date de retour est antérieure à la date de départ.'
  }

  return null
}

// ─── Fonction principale ──────────────────────────────────────────────────────
export function calculer_devis(input: DevisInput): DevisResult | DevisError {

  // 1. Validation des champs
  const errValidation = valider(input)
  if (errValidation) {
    return {
      success: false,
      error: errValidation,
      besoin_reprise_humaine: false,
      raison_reprise_humaine: null,
      hint: 'Vérifiez que tous les champs obligatoires sont renseignés et non vides.',
    }
  }

  // 2. Distance
  const distanceKm = getDistance(input.depart, input.destination)
  if (distanceKm === null) {
    const departN = normaliser(input.depart)
    const destN   = normaliser(input.destination)
    return {
      success: false,
      error: `Distance "${input.depart} → ${input.destination}" non disponible dans le référentiel MVP — reprise humaine nécessaire.`,
      besoin_reprise_humaine: true,
      raison_reprise_humaine: `Combinaison "${departN}|${destN}" absente de la table de distances MVP. Ajouter la distance ou intégrer une API Maps.`,
      hint: 'Ce n\'est pas un champ manquant — les villes ont bien été trouvées mais la paire n\'existe pas dans le référentiel interne.',
    }
  }

  const warnings: string[] = []
  let besoin_reprise_humaine = false
  let raison_reprise_humaine: string | null = null

  if (input.nb_passagers > 85) {
    besoin_reprise_humaine = true
    raison_reprise_humaine = `Groupe de ${input.nb_passagers} passagers dépasse la capacité standard (85 pax). Contactez-nous pour les grands groupes.`
  }
  if (input.type_trajet === 'circuit') {
    besoin_reprise_humaine = true
    raison_reprise_humaine = raison_reprise_humaine ?? 'Circuit multi-étapes — validation humaine recommandée pour confirmer les étapes.'
  }
  if (input.urgence === 'tres_urgent') {
    warnings.push('Demande très urgente — le prix inclut une majoration de 30 %.')
  }
  if (input.nb_passagers > 50) {
    warnings.push('Grand groupe (> 50 pax) — vérification capacité autocar recommandée.')
  }
  if (input.options?.includes('hostesse')) {
    warnings.push('Hôtesse : disponibilité à confirmer selon le prestataire.')
  }

  // 3. Calcul ligne par ligne
  const lignes: LigneCalcul[] = []
  const coefficients: Record<string, number> = {}

  // — Base kilométrique [MOCK MVP]
  const baseKm = Math.round(distanceKm * TARIF_KM * 100) / 100
  lignes.push({
    label: 'Transport kilométrique',
    montant: baseKm,
    formule: 'distance_km × tarif_km',
    variables: { distance_km: distanceKm, tarif_km: TARIF_KM },
    source_regle: 'Barème kilométrique MVP',
    source_type: 'mock_mvp',
    justification: `${distanceKm} km (référentiel distance interne MVP) × ${TARIF_KM} €/km — Hypothèse MVP : à remplacer par le barème réel NeoTravel.`,
  })

  // — Frais de mise en route [MOCK MVP]
  lignes.push({
    label: 'Frais de mise en route',
    montant: FRAIS_MISE_EN_ROUTE,
    formule: 'forfait_fixe',
    variables: { forfait_fixe: FRAIS_MISE_EN_ROUTE },
    source_regle: 'Forfait mise en route MVP',
    source_type: 'mock_mvp',
    justification: `Forfait fixe de ${FRAIS_MISE_EN_ROUTE} € couvrant les frais administratifs et logistiques de mise en route — Hypothèse MVP.`,
  })

  // — Coefficient type de trajet
  let coeffTrajet = 1.0
  const typeTrajet = input.type_trajet || 'aller_simple'
  const baseAvantCoeff = baseKm + FRAIS_MISE_EN_ROUTE

  if (typeTrajet === 'aller_retour') {
    coeffTrajet = COEFF_ALLER_RETOUR
    coefficients['aller_retour'] = coeffTrajet
    const surplus = Math.round(baseAvantCoeff * (COEFF_ALLER_RETOUR - 1) * 100) / 100
    lignes.push({
      label: 'Supplément aller-retour',
      montant: surplus,
      formule: 'base × (coeff_ar - 1)',
      variables: { base: baseAvantCoeff, coeff_ar: COEFF_ALLER_RETOUR },
      source_regle: 'Règle aller-retour MVP',
      source_type: 'mock_mvp',
      justification: `Coefficient ×${COEFF_ALLER_RETOUR} appliqué sur la base — pas un simple ×2 car le retour à vide est optimisé. Hypothèse MVP.`,
    })
  } else if (typeTrajet === 'circuit') {
    coeffTrajet = COEFF_CIRCUIT
    coefficients['circuit'] = coeffTrajet
    const surplus = Math.round(baseAvantCoeff * (COEFF_CIRCUIT - 1) * 100) / 100
    lignes.push({
      label: 'Supplément circuit multi-étapes',
      montant: surplus,
      formule: 'base × (coeff_circuit - 1)',
      variables: { base: baseAvantCoeff, coeff_circuit: COEFF_CIRCUIT },
      source_regle: 'Règle circuit MVP',
      source_type: 'mock_mvp',
      justification: `Circuit avec étapes multiples — coefficient ×${COEFF_CIRCUIT} pour couvrir les temps d'attente et détours. Hypothèse MVP.`,
    })
  }

  // — Coefficient urgence
  const urgenceKey = input.urgence || 'normal'
  const coeffUrg = COEFF_URGENCE[urgenceKey] ?? 1.0
  coefficients['urgence'] = coeffUrg
  if (coeffUrg > 1.0) {
    const sousTotal = baseAvantCoeff * coeffTrajet
    const surplus = Math.round(sousTotal * (coeffUrg - 1) * 100) / 100
    lignes.push({
      label: `Supplément urgence (${urgenceKey.replace('_', ' ')})`,
      montant: surplus,
      formule: 'sous_total × (coeff_urgence - 1)',
      variables: { sous_total: sousTotal, coeff_urgence: coeffUrg },
      source_regle: 'Règle urgence MVP',
      source_type: 'mock_mvp',
      justification: `Majoration de ${Math.round((coeffUrg - 1) * 100)} % pour demande urgente — mobilisation prioritaire des prestataires. Hypothèse MVP.`,
    })
  }

  // — Options
  for (const opt of input.options ?? []) {
    const tarif = OPTIONS_PRIX[opt]
    if (tarif === undefined) continue
    const montant = typeof tarif === 'function' ? tarif(input.nb_passagers) : tarif
    if (montant > 0) {
      const isPerPax = typeof tarif === 'function'
      lignes.push({
        label: `Option : ${opt}`,
        montant,
        formule: isPerPax ? 'prix_par_pax × nb_passagers' : 'forfait_fixe',
        variables: isPerPax ? { prix_par_pax: montant / input.nb_passagers, nb_passagers: input.nb_passagers } : { forfait: montant },
        source_regle: `Tarif option ${opt} MVP`,
        source_type: 'mock_mvp',
        justification: isPerPax
          ? `${montant / input.nb_passagers} €/passager × ${input.nb_passagers} passagers. Hypothèse MVP.`
          : `Forfait fixe ${opt}. Hypothèse MVP.`,
      })
    }
  }

  // 4. Totaux
  const prix_ht  = Math.round(lignes.reduce((s, l) => s + l.montant, 0) * 100) / 100
  const tva      = Math.round(prix_ht * TVA_TAUX * 100) / 100
  const prix_ttc = Math.round((prix_ht + tva) * 100) / 100

  // 5. Sources synthétiques
  const sources_calcul: CalculationSource[] = [
    {
      label: 'Distance utilisée',
      valeur: `${distanceKm} km`,
      source_type: 'mock_mvp',
      justification: 'Référentiel distance interne MVP — distances routières approximatives. À remplacer par l\'API Google Maps Distance Matrix ou équivalent.',
    },
    {
      label: 'Tarif kilométrique',
      valeur: `${TARIF_KM} €/km`,
      source_type: 'mock_mvp',
      justification: 'Hypothèse MVP : 2,50 €/km. À calibrer avec les barèmes réels des autocaristes partenaires.',
    },
    {
      label: 'TVA transport voyageurs',
      valeur: `${TVA_TAUX * 100} %`,
      source_type: 'regle_documentee',
      justification: 'Article 279-b CGI — taux réduit de TVA à 10 % applicable aux prestations de transport de voyageurs.',
    },
    {
      label: 'Coefficient urgence',
      valeur: coeffUrg,
      source_type: 'mock_mvp',
      justification: 'Hypothèse MVP : ×1,15 (urgent), ×1,30 (très urgent). À valider avec l\'équipe commerciale NeoTravel.',
    },
    ...(typeTrajet !== 'aller_simple' ? [{
      label: `Coefficient ${typeTrajet.replace('_', '-')}`,
      valeur: coeffTrajet,
      source_type: 'mock_mvp' as SourceType,
      justification: 'Hypothèse MVP — voir règle barème interne à définir.',
    }] : []),
  ]

  // 6. Explication synthétique
  const typeLabel = { aller_simple: 'aller simple', aller_retour: 'aller-retour', circuit: 'circuit' }[typeTrajet] ?? typeTrajet
  const explication_calcul =
    `Devis calculé pour un ${typeLabel} de ${input.depart} à ${input.destination} ` +
    `(${distanceKm} km, référentiel MVP) pour ${input.nb_passagers} passager(s). ` +
    `Base : ${distanceKm} km × ${TARIF_KM} €/km + forfait ${FRAIS_MISE_EN_ROUTE} € = ${baseAvantCoeff.toFixed(2)} € HT. ` +
    (coeffUrg > 1 ? `Majoration urgence ×${coeffUrg}. ` : '') +
    (coeffTrajet > 1 ? `Coefficient trajet ×${coeffTrajet}. ` : '') +
    `Total HT : ${prix_ht} € — TVA ${TVA_TAUX * 100} % (règle documentée) : ${tva} € — ` +
    `Total TTC : ${prix_ttc} €. ` +
    `⚠ Ce calcul repose sur des hypothèses MVP. Les montants sont indicatifs.`

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
    sources_calcul,
    explication_calcul,
  }
}
