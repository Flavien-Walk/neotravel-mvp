/**
 * calculer_devis() — Moteur de calcul déterministe NeoTravel.
 *
 * RÈGLE ABSOLUE : Cette fonction ne dépend d'aucun LLM.
 * "L'agent collecte et orchestre, le code calcule."
 *
 * Barème : grille tarifaire fixe (≤180 km) ou (KM×2)×2.50€ (>180 km) — source_type "regle_documentee".
 * Règles documentées (TVA, saisonnalité, urgence, capacité, marge) — source_type "regle_documentee".
 *
 * Ordre de calcul :
 *   prix_base (grille ou formule >180km)
 *   → × coeff_type_trajet (aller-retour = ×2)
 *   → × coeff_capacite
 *   → × coeff_saisonnalite
 *   → × coeff_urgence (calculé depuis date_depart : ≤14j/15-30j/31-90j/>90j)
 *   → × (1 + MARGE_TAUX)
 *   → + options (guide, nuit chauffeur, péages)
 *   = prix_ht → + TVA 10% = prix_ttc
 */

export type SourceType = 'mock_mvp' | 'regle_documentee' | 'hypothese_mvp' | 'a_definir'

export interface DevisInput {
  depart:       string
  destination:  string
  date_depart:  string
  date_retour?: string
  nb_passagers: number
  type_trajet:  string
  options?:     string[]
  urgence?:     string   // conservé pour compatibilité ascendante ; le coefficient est recalculé depuis date_depart
}

export interface LigneCalcul {
  label:         string
  montant:       number
  formule:       string
  variables:     Record<string, number | string>
  source_regle:  string
  source_type:   SourceType
  justification: string
}

export interface CalculationSource {
  label:         string
  valeur:        string | number
  source_type:   SourceType
  justification: string
}

export interface DevisResult {
  success:                true
  prix_ht:                number
  tva:                    number
  prix_ttc:               number
  distance_km:            number
  duree_estimee:          string
  lignes_calcul:          LigneCalcul[]
  coefficients:           Record<string, number>
  warnings:               string[]
  besoin_reprise_humaine: boolean
  raison_reprise_humaine: string | null
  sources_calcul:         CalculationSource[]
  explication_calcul:     string
}

export interface DevisError {
  success:                false
  error:                  string
  besoin_reprise_humaine: boolean
  raison_reprise_humaine: string | null
  hint?:                  string
}

// ─── Constantes tarifaires ────────────────────────────────────────────────────

const TVA_TAUX            = 0.10   // 10 % — Article 279-b CGI
const MARGE_TAUX          = 0.15   // 15 % — Politique tarifaire NeoTravel

const COEFF_ALLER_RETOUR  = 2.00   // Règle NeoTravel : prix simple × 2
const COEFF_CIRCUIT       = 2.20   // [MOCK MVP] — circuit multi-étapes

const OPTION_GUIDE_PAR_JOUR = 80   // €/jour — Tarif guide/accompagnateur NeoTravel
const OPTION_NUIT_CHAUFFEUR = 120  // €/nuit — Hébergement chauffeur NeoTravel

const TARIF_KM_HORS_GRILLE = 2.50  // €/km pour distances > 180 km

// ─── Grille tarifaire transfert simple (≤ 180 km) ────────────────────────────
const TARIF_GRILLE: { maxKm: number; prix: number }[] = [
  { maxKm: 10,  prix: 250 },
  { maxKm: 20,  prix: 250 },
  { maxKm: 30,  prix: 250 },
  { maxKm: 40,  prix: 320 },
  { maxKm: 50,  prix: 350 },
  { maxKm: 60,  prix: 390 },
  { maxKm: 70,  prix: 430 },
  { maxKm: 80,  prix: 500 },
  { maxKm: 90,  prix: 540 },
  { maxKm: 100, prix: 580 },
  { maxKm: 110, prix: 620 },
  { maxKm: 120, prix: 660 },
  { maxKm: 130, prix: 700 },
  { maxKm: 140, prix: 740 },
  { maxKm: 150, prix: 780 },
  { maxKm: 160, prix: 820 },
  { maxKm: 170, prix: 860 },
  { maxKm: 180, prix: 900 },
]

// getPrixBase défini après r2() — voir section Utilitaires

// ─── Table de distances routières [MOCK MVP] ──────────────────────────────────
const DISTANCES_KM: Record<string, number> = {
  'paris|lyon':             465,
  'paris|marseille':        775,
  'paris|bordeaux':         585,
  'paris|toulouse':         680,
  'paris|lille':            225,
  'paris|nantes':           385,
  'paris|strasbourg':       490,
  'paris|rennes':           350,
  'paris|nice':             930,
  'paris|montpellier':      750,
  'paris|grenoble':         570,
  'paris|dijon':            310,
  'paris|reims':            145,
  'paris|toulon':           840,
  'paris|angers':           295,
  'paris|tours':            235,
  'paris|caen':             230,
  'paris|rouen':            135,
  'paris|metz':             310,
  'paris|nancy':            370,
  'paris|clermont':         425,
  'paris|clermontferrand':  425,
  'paris|limoges':          395,
  'paris|amiens':           140,
  'paris|orleans':          130,
  'lyon|marseille':         315,
  'lyon|bordeaux':          555,
  'lyon|toulouse':          430,
  'lyon|lille':             670,
  'lyon|nice':              300,
  'lyon|grenoble':          105,
  'lyon|montpellier':       330,
  'lyon|strasbourg':        490,
  'lyon|dijon':             195,
  'lyon|clermont':          165,
  'lyon|clermontferrand':   165,
  'marseille|toulouse':     405,
  'marseille|bordeaux':     640,
  'marseille|nice':         200,
  'marseille|montpellier':  170,
  'marseille|toulon':        65,
  'bordeaux|toulouse':      245,
  'bordeaux|nantes':        345,
  'bordeaux|rennes':        445,
  'bordeaux|limoges':       215,
  'toulouse|nice':          600,
  'toulouse|montpellier':   240,
  'lille|rennes':           530,
  'lille|strasbourg':       530,
  'nantes|rennes':          110,
  'nantes|tours':           135,
  'nantes|angers':           95,
  'strasbourg|metz':        165,
  'strasbourg|nancy':       150,
  'grenoble|nice':          300,
  'grenoble|marseille':     300,
  'dijon|reims':            290,
  'reims|lille':            200,
  'reims|strasbourg':       275,
  'angers|tours':            90,
  'tours|orleans':          115,
  'metz|nancy':              55,
  'caen|rouen':             130,
  'caen|rennes':            185,
  'rouen|amiens':            90,
}

// ─── Règles saisonnalité ──────────────────────────────────────────────────────

interface SaisonInfo { label: string; coeff: number; nom: string }

const SAISON_PAR_MOIS: Record<number, SaisonInfo> = {
  1:  { nom: 'basse',      coeff: 0.93, label: 'Basse saison — janvier'         },
  2:  { nom: 'basse',      coeff: 0.93, label: 'Basse saison — février'          },
  3:  { nom: 'haute',      coeff: 1.10, label: 'Haute saison — mars'             },
  4:  { nom: 'haute',      coeff: 1.10, label: 'Haute saison — avril'            },
  5:  { nom: 'tres_haute', coeff: 1.15, label: 'Très haute saison — mai'         },
  6:  { nom: 'tres_haute', coeff: 1.15, label: 'Très haute saison — juin'        },
  7:  { nom: 'haute',      coeff: 1.10, label: 'Haute saison — juillet'          },
  8:  { nom: 'basse',      coeff: 0.93, label: 'Basse saison — août'             },
  9:  { nom: 'moyenne',    coeff: 1.00, label: 'Moyenne saison — septembre'      },
  10: { nom: 'moyenne',    coeff: 1.00, label: 'Moyenne saison — octobre'        },
  11: { nom: 'basse',      coeff: 0.93, label: 'Basse saison — novembre'         },
  12: { nom: 'moyenne',    coeff: 1.00, label: 'Moyenne saison — décembre'       },
}

function getSaison(date_depart: string): SaisonInfo {
  const mois = new Date(date_depart).getMonth() + 1
  return SAISON_PAR_MOIS[mois] ?? { nom: 'inconnue', label: 'Saison inconnue', coeff: 1.0 }
}

// ─── Règles urgence (calculées depuis date_depart) ────────────────────────────

interface UrgenceInfo { label: string; coeff: number; diffDays: number; niveau: string }

function getUrgence(date_depart: string, todayISO?: string): UrgenceInfo {
  const today = todayISO ? new Date(todayISO) : new Date()
  today.setHours(0, 0, 0, 0)
  const dep = new Date(date_depart)
  dep.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((dep.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 14) return { niveau: 'prioritaire',  coeff: 1.10, diffDays, label: `Prioritaire — départ dans ${Math.max(0, diffDays)}j (≤14j)` }
  if (diffDays <= 30) return { niveau: 'urgent',        coeff: 1.05, diffDays, label: `Urgent — départ dans ${diffDays}j (15–30j)` }
  if (diffDays <= 90) return { niveau: 'normal',        coeff: 0.95, diffDays, label: `Normal — départ dans ${diffDays}j (31–90j)` }
  return               { niveau: 'anticipation',        coeff: 0.90, diffDays, label: `Anticipation — départ dans ${diffDays}j (>90j)` }
}

// ─── Règles capacité ─────────────────────────────────────────────────────────

interface CapaciteInfo { label: string; coeff: number; besoin_reprise: boolean }

function getCapacite(nb: number): CapaciteInfo {
  if (nb > 85) return { coeff: 1,    besoin_reprise: true,  label: `Grand groupe (${nb} pax > 85)` }
  if (nb >= 68) return { coeff: 1.40, besoin_reprise: false, label: `Grand autocar 68–85 pax (${nb} pax)` }
  if (nb >= 64) return { coeff: 1.20, besoin_reprise: false, label: `Grand autocar 64–67 pax (${nb} pax)` }
  if (nb >= 54) return { coeff: 1.15, besoin_reprise: false, label: `Grand autocar 54–63 pax (${nb} pax)` }
  if (nb >= 20) return { coeff: 1.00, besoin_reprise: false, label: `Autocar standard 20–53 pax (${nb} pax)` }
  return               { coeff: 0.95, besoin_reprise: false, label: `Minibus ≤ 19 pax (${nb} pax)` }
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function normaliser(ville: string): string {
  return ville
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function getDistance(depart: string, destination: string): number | null {
  const a = normaliser(depart)
  const b = normaliser(destination)
  if (!a || !b) return null
  return DISTANCES_KM[`${a}|${b}`] ?? DISTANCES_KM[`${b}|${a}`] ?? null
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

function getPrixBase(distanceKm: number): { prix: number; formule: string; source_type: SourceType } {
  const entry = TARIF_GRILLE.find(t => distanceKm <= t.maxKm)
  if (entry) {
    return {
      prix: entry.prix,
      formule: `grille_tarifaire[≤${entry.maxKm}km]`,
      source_type: 'regle_documentee',
    }
  }
  // > 180 km : (KM × 2) × 2.50 €/km
  const prix = r2(distanceKm * 2 * TARIF_KM_HORS_GRILLE)
  return {
    prix,
    formule: `(${distanceKm} × 2) × ${TARIF_KM_HORS_GRILLE} €/km`,
    source_type: 'regle_documentee',
  }
}

function estimerDuree(distanceKm: number, typeTrajet: string): string {
  const baseMins = Math.round(distanceKm * (60 / 80) + 30)
  const totalMins = typeTrajet === 'aller_retour' ? baseMins * 2 : baseMins
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const sfx = typeTrajet === 'aller_retour' ? ' (aller + retour)' : typeTrajet === 'circuit' ? ' (estimation)' : ''
  return `${h}h${m.toString().padStart(2, '0')}${sfx}`
}

function getNbJoursNuits(date_depart: string, date_retour?: string): { jours: number; nuits: number } {
  if (!date_retour) return { jours: 1, nuits: 0 }
  const dep = new Date(date_depart)
  const ret = new Date(date_retour)
  const diff = Math.round((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24))
  return { jours: Math.max(1, diff + 1), nuits: Math.max(0, diff) }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function valider(input: DevisInput): string | null {
  const dep = input.depart?.trim()
  const dst = input.destination?.trim()
  if (!dep) return 'Ville de départ manquante ou vide.'
  if (!dst) return 'Ville de destination manquante ou vide.'
  if (dep.toLowerCase() === dst.toLowerCase()) return 'Le départ et la destination ne peuvent pas être identiques.'
  if (!input.date_depart) return 'Date de départ manquante.'
  if (isNaN(new Date(input.date_depart).getTime())) return 'Date de départ invalide.'
  const nbPax = input.nb_passagers
  if (nbPax === undefined || nbPax === null) return 'Nombre de passagers manquant.'
  if (!Number.isFinite(nbPax) || nbPax < 1) return 'Le nombre de passagers doit être un entier positif.'
  if (input.date_retour) {
    if (isNaN(new Date(input.date_retour).getTime())) return 'Date de retour invalide.'
    if (new Date(input.date_retour) < new Date(input.date_depart)) return 'La date de retour est antérieure à la date de départ.'
  }
  return null
}

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * @param input  Données du devis
 * @param _testTodayISO  Date de référence ISO pour les tests (ex: "2026-01-01"). En production, omis = Date.now().
 */
export function calculer_devis(input: DevisInput, _testTodayISO?: string): DevisResult | DevisError {

  // 1. Validation
  const errValidation = valider(input)
  if (errValidation) {
    return { success: false, error: errValidation, besoin_reprise_humaine: false, raison_reprise_humaine: null, hint: 'Vérifiez que tous les champs obligatoires sont renseignés.' }
  }

  // 2. Distance
  const distanceKm = getDistance(input.depart, input.destination)
  if (distanceKm === null) {
    return {
      success: false,
      error: `Distance "${input.depart} → ${input.destination}" non disponible dans le référentiel — reprise humaine nécessaire.`,
      besoin_reprise_humaine: true,
      raison_reprise_humaine: `Paire "${normaliser(input.depart)}|${normaliser(input.destination)}" absente du référentiel. Ajouter la distance ou intégrer une API Maps.`,
      hint: 'Les villes ont été trouvées mais la paire n\'existe pas dans le référentiel de distances interne.',
    }
  }

  const warnings: string[] = []
  let besoin_reprise_humaine = false
  let raison_reprise_humaine: string | null = null

  // 3. Règles métier
  const typeTrajet = input.type_trajet || 'aller_simple'
  const saison     = getSaison(input.date_depart)
  const urgence    = getUrgence(input.date_depart, _testTodayISO)
  const capacite   = getCapacite(input.nb_passagers)

  if (capacite.besoin_reprise) {
    besoin_reprise_humaine = true
    raison_reprise_humaine = `Groupe de ${input.nb_passagers} passagers (> 85 pax) — plusieurs autocars nécessaires. Contactez-nous pour les grands groupes.`
  }
  if (typeTrajet === 'circuit') {
    besoin_reprise_humaine = true
    raison_reprise_humaine = raison_reprise_humaine ?? 'Circuit multi-étapes — validation humaine recommandée pour confirmer les étapes.'
  }
  if (urgence.niveau === 'prioritaire') {
    warnings.push(`Départ dans ${Math.max(0, urgence.diffDays)} jour(s) — majoration prioritaire +10 %.`)
  }

  // 4. Lignes de calcul
  const lignes: LigneCalcul[] = []
  const coefficients: Record<string, number> = {}

  // — Prix de base (grille tarifaire ≤180 km ou formule >180 km)
  const prixBase = getPrixBase(distanceKm)
  lignes.push({
    label:         'Transfert simple',
    montant:       prixBase.prix,
    formule:       prixBase.formule,
    variables:     { distance_km: distanceKm, prix_base: prixBase.prix },
    source_regle:  'Grille tarifaire NeoTravel',
    source_type:   prixBase.source_type,
    justification: distanceKm <= 180
      ? `Distance ${distanceKm} km → grille tarifaire : ${prixBase.prix} €.`
      : `Distance ${distanceKm} km (> 180 km) → (${distanceKm} × 2) × ${TARIF_KM_HORS_GRILLE} €/km = ${prixBase.prix} €.`,
  })

  let sousTotal = prixBase.prix

  // — Coefficient type de trajet
  const coeffTrajet = typeTrajet === 'aller_retour' ? COEFF_ALLER_RETOUR : typeTrajet === 'circuit' ? COEFF_CIRCUIT : 1.0
  coefficients['type_trajet'] = coeffTrajet
  if (coeffTrajet !== 1.0) {
    const delta = r2(sousTotal * (coeffTrajet - 1))
    const typeLabel = typeTrajet === 'aller_retour' ? 'aller-retour' : 'circuit'
    lignes.push({
      label:         `Supplément ${typeLabel}`,
      montant:       delta,
      formule:       `prix_base × (coeff_trajet − 1) = ${sousTotal.toFixed(2)} × ${(coeffTrajet - 1).toFixed(2)}`,
      variables:     { prix_base: sousTotal, coeff_trajet: coeffTrajet },
      source_regle:  'Règle type trajet NeoTravel',
      source_type:   'regle_documentee',
      justification: typeTrajet === 'aller_retour'
        ? `Aller-retour : prix simple × ${COEFF_ALLER_RETOUR} — règle NeoTravel.`
        : `Coefficient ×${COEFF_CIRCUIT} — circuit multi-étapes avec temps d'attente. [MOCK MVP]`,
    })
    sousTotal = r2(sousTotal * coeffTrajet)
  }

  // — Ajustement capacité
  coefficients['capacite'] = capacite.coeff
  if (capacite.coeff !== 1.0 && !capacite.besoin_reprise) {
    const delta = r2(sousTotal * (capacite.coeff - 1))
    const pct   = ((capacite.coeff - 1) * 100).toFixed(0)
    lignes.push({
      label:         `Ajustement capacité — ${capacite.label}`,
      montant:       delta,
      formule:       `sous_total × (coeff_cap − 1) = ${sousTotal.toFixed(2)} × ${(capacite.coeff - 1).toFixed(2)}`,
      variables:     { sous_total: sousTotal, coeff_cap: capacite.coeff, nb_passagers: input.nb_passagers },
      source_regle:  'Barème capacité NeoTravel',
      source_type:   'regle_documentee',
      justification: `${capacite.label} → ajustement ${delta >= 0 ? '+' : ''}${pct} % selon barème capacité NeoTravel.`,
    })
    sousTotal = r2(sousTotal * capacite.coeff)
  }

  // — Ajustement saisonnalité
  coefficients['saison'] = saison.coeff
  if (saison.coeff !== 1.0) {
    const delta = r2(sousTotal * (saison.coeff - 1))
    const pct   = ((saison.coeff - 1) * 100).toFixed(0)
    lignes.push({
      label:         `Ajustement saisonnalité — ${saison.label}`,
      montant:       delta,
      formule:       `sous_total × (coeff_saison − 1) = ${sousTotal.toFixed(2)} × ${(saison.coeff - 1).toFixed(2)}`,
      variables:     { sous_total: sousTotal, coeff_saison: saison.coeff, mois: new Date(input.date_depart).getMonth() + 1 },
      source_regle:  'Barème saisonnalité NeoTravel',
      source_type:   'regle_documentee',
      justification: `${saison.label} → ajustement ${delta >= 0 ? '+' : ''}${pct} % selon barème saisonnalité NeoTravel.`,
    })
    sousTotal = r2(sousTotal * saison.coeff)
  }

  // — Ajustement urgence (calculé depuis date_depart, pas depuis input.urgence)
  coefficients['urgence'] = urgence.coeff
  const deltaUrgence = r2(sousTotal * (urgence.coeff - 1))
  if (urgence.coeff !== 1.0) {
    const pct = ((urgence.coeff - 1) * 100).toFixed(0)
    lignes.push({
      label:         `Ajustement urgence — ${urgence.label}`,
      montant:       deltaUrgence,
      formule:       `sous_total × (coeff_urgence − 1) = ${sousTotal.toFixed(2)} × ${(urgence.coeff - 1).toFixed(2)}`,
      variables:     { sous_total: sousTotal, coeff_urgence: urgence.coeff, jours_avant_depart: urgence.diffDays },
      source_regle:  'Barème urgence NeoTravel',
      source_type:   'regle_documentee',
      justification: `${urgence.label} → ajustement ${deltaUrgence >= 0 ? '+' : ''}${pct} % selon barème urgence NeoTravel.`,
    })
  }
  sousTotal = r2(sousTotal * urgence.coeff)

  // — Marge commerciale NeoTravel (15%)
  coefficients['marge'] = MARGE_TAUX
  const deltaMarge = r2(sousTotal * MARGE_TAUX)
  lignes.push({
    label:         'Marge commerciale NeoTravel',
    montant:       deltaMarge,
    formule:       `sous_total × marge = ${sousTotal.toFixed(2)} × ${MARGE_TAUX}`,
    variables:     { sous_total: sousTotal, marge: MARGE_TAUX },
    source_regle:  'Politique tarifaire NeoTravel',
    source_type:   'regle_documentee',
    justification: `Marge commerciale NeoTravel de ${MARGE_TAUX * 100} % incluse dans le prix de vente.`,
  })
  sousTotal = r2(sousTotal * (1 + MARGE_TAUX))

  // — Options
  const { jours: nbJours, nuits: nbNuits } = getNbJoursNuits(input.date_depart, input.date_retour)

  for (const opt of input.options ?? []) {
    const optNorm = opt.toLowerCase().replace(/[\s_-]+/g, '_')

    if (optNorm.includes('guide') || optNorm.includes('accompagnateur')) {
      const montant = r2(OPTION_GUIDE_PAR_JOUR * nbJours)
      lignes.push({
        label:         'Option : guide / accompagnateur',
        montant,
        formule:       `prix_jour × nb_jours = ${OPTION_GUIDE_PAR_JOUR} × ${nbJours}`,
        variables:     { prix_jour: OPTION_GUIDE_PAR_JOUR, nb_jours: nbJours },
        source_regle:  'Tarif option guide NeoTravel',
        source_type:   'regle_documentee',
        justification: `Guide/accompagnateur : ${OPTION_GUIDE_PAR_JOUR} €/jour × ${nbJours} jour(s) = ${montant} €.`,
      })
    } else if (optNorm.includes('nuit') || (optNorm.includes('chauffeur') && !optNorm.includes('guide'))) {
      if (nbNuits === 0) {
        warnings.push('Option "nuit chauffeur" sélectionnée mais aucune nuit détectée (trajet en 1 jour) — non facturée. Ajoutez une date de retour si le séjour est multi-jours.')
      } else {
        const montant = r2(OPTION_NUIT_CHAUFFEUR * nbNuits)
        lignes.push({
          label:         'Option : nuit chauffeur',
          montant,
          formule:       `prix_nuit × nb_nuits = ${OPTION_NUIT_CHAUFFEUR} × ${nbNuits}`,
          variables:     { prix_nuit: OPTION_NUIT_CHAUFFEUR, nb_nuits: nbNuits },
          source_regle:  'Tarif option nuit chauffeur NeoTravel',
          source_type:   'regle_documentee',
          justification: `Hébergement chauffeur : ${OPTION_NUIT_CHAUFFEUR} €/nuit × ${nbNuits} nuit(s) = ${montant} €.`,
        })
      }
    } else if (optNorm.includes('peage') || optNorm.includes('toll') || optNorm.includes('autoroute')) {
      warnings.push('Option "péages" : forfait non disponible pour cette route — montant à définir avec le commercial NeoTravel.')
      lignes.push({
        label:         'Option : péages autoroute',
        montant:       0,
        formule:       'a_definir',
        variables:     {},
        source_regle:  'Péages NeoTravel',
        source_type:   'a_definir',
        justification: 'Péages autoroute : montant à confirmer selon l\'itinéraire exact. Non inclus dans ce devis indicatif.',
      })
    } else if (optNorm !== '') {
      warnings.push(`Option "${opt}" non reconnue — ignorée dans le calcul.`)
    }
  }

  // 5. Totaux
  const prix_ht  = r2(lignes.reduce((s, l) => s + l.montant, 0))
  const tva      = r2(prix_ht * TVA_TAUX)
  const prix_ttc = r2(prix_ht + tva)

  // Stocker distance_km pour PDF (coefficients est sauvegardé en DB)
  coefficients['distance_km'] = distanceKm
  coefficients['tva']         = TVA_TAUX

  const duree_estimee = estimerDuree(distanceKm, typeTrajet)

  // 6. Sources synthétiques
  const sources_calcul: CalculationSource[] = [
    {
      label:         'Distance utilisée',
      valeur:        `${distanceKm} km`,
      source_type:   'mock_mvp',
      justification: 'Référentiel distance interne MVP — distances routières approximatives. À remplacer par l\'API Google Maps Distance Matrix.',
    },
    {
      label:         'Tarif de base',
      valeur:        `${prixBase.prix} €`,
      source_type:   prixBase.source_type,
      justification: distanceKm <= 180
        ? `Grille tarifaire NeoTravel : distance ${distanceKm} km → ${prixBase.prix} €.`
        : `Distance > 180 km → (${distanceKm} × 2) × ${TARIF_KM_HORS_GRILLE} €/km = ${prixBase.prix} €.`,
    },
    {
      label:         'TVA transport voyageurs',
      valeur:        `${TVA_TAUX * 100} %`,
      source_type:   'regle_documentee',
      justification: 'Article 279-b CGI — taux réduit de TVA à 10 % pour les prestations de transport de voyageurs.',
    },
    {
      label:         `Saisonnalité — ${saison.label}`,
      valeur:        `×${saison.coeff}`,
      source_type:   'regle_documentee',
      justification: `Barème saisonnalité NeoTravel. Mois ${new Date(input.date_depart).getMonth() + 1} → coefficient ×${saison.coeff}.`,
    },
    {
      label:         `Urgence — ${urgence.label}`,
      valeur:        `×${urgence.coeff}`,
      source_type:   'regle_documentee',
      justification: `Barème urgence NeoTravel. ${urgence.diffDays} jours avant départ → coefficient ×${urgence.coeff}.`,
    },
    {
      label:         `Capacité — ${capacite.label}`,
      valeur:        `×${capacite.coeff}`,
      source_type:   'regle_documentee',
      justification: `Barème capacité NeoTravel. ${input.nb_passagers} passager(s) → coefficient ×${capacite.coeff}.`,
    },
    {
      label:         'Marge commerciale',
      valeur:        `${MARGE_TAUX * 100} %`,
      source_type:   'regle_documentee',
      justification: 'Marge commerciale NeoTravel de 15 % incluse dans le prix HT.',
    },
  ]

  // 7. Explication synthétique
  const typeLabel   = ({ aller_simple: 'aller simple', aller_retour: 'aller-retour', circuit: 'circuit' } as Record<string, string>)[typeTrajet] ?? typeTrajet
  const explication_calcul =
    `Devis ${typeLabel} ${input.depart} → ${input.destination} (${distanceKm} km) pour ${input.nb_passagers} passager(s). ` +
    `Durée estimée : ${duree_estimee}. ` +
    (distanceKm <= 180
      ? `Base : grille tarifaire ${distanceKm} km → ${prixBase.prix} € HT. `
      : `Base : (${distanceKm} × 2) × ${TARIF_KM_HORS_GRILLE} €/km = ${prixBase.prix} € HT. `) +
    (coeffTrajet !== 1 ? `Type trajet ×${coeffTrajet}. ` : '') +
    (capacite.coeff !== 1 && !capacite.besoin_reprise ? `Capacité ×${capacite.coeff} (${capacite.label}). ` : '') +
    (saison.coeff !== 1 ? `Saisonnalité ×${saison.coeff} (${saison.label}). ` : '') +
    `Urgence ×${urgence.coeff} (${urgence.label}). ` +
    `Marge ×${(1 + MARGE_TAUX).toFixed(2)}. ` +
    `Total HT : ${prix_ht.toFixed(2)} € — TVA 10 % (Art.279-b CGI) : ${tva.toFixed(2)} € — TTC : ${prix_ttc.toFixed(2)} €.` +
    (besoin_reprise_humaine ? ` ⚠ Reprise humaine nécessaire : ${raison_reprise_humaine}` : '')

  return {
    success:                true,
    prix_ht,
    tva,
    prix_ttc,
    distance_km:            distanceKm,
    duree_estimee,
    lignes_calcul:          lignes,
    coefficients,
    warnings,
    besoin_reprise_humaine,
    raison_reprise_humaine,
    sources_calcul,
    explication_calcul,
  }
}
