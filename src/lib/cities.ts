export interface City {
  id: string
  nom: string
  aliases: string[]
  zone: string
  lat: number
  lng: number
}

export const CITIES: City[] = [
  { id: 'paris',            nom: 'Paris',            aliases: ['paris', 'ile de france', 'idf', 'boulogne', 'vincennes', 'saint cloud'], zone: 'Île-de-France',               lat: 48.8566, lng:  2.3522 },
  { id: 'lyon',             nom: 'Lyon',              aliases: ['lyon', 'villeurbanne', 'bron', 'venissieux', 'caluire'],               zone: 'Auvergne-Rhône-Alpes',        lat: 45.7640, lng:  4.8357 },
  { id: 'marseille',        nom: 'Marseille',         aliases: ['marseille', 'ma', 'martigues'],                                        zone: 'Provence-Alpes-Côte d\'Azur', lat: 43.2965, lng:  5.3698 },
  { id: 'nice',             nom: 'Nice',              aliases: ['nice', 'alpes maritimes', 'cote dazur'],                               zone: 'Provence-Alpes-Côte d\'Azur', lat: 43.7102, lng:  7.2620 },
  { id: 'bordeaux',         nom: 'Bordeaux',          aliases: ['bordeaux', 'merignac', 'pessac'],                                      zone: 'Nouvelle-Aquitaine',          lat: 44.8378, lng: -0.5792 },
  { id: 'toulouse',         nom: 'Toulouse',          aliases: ['toulouse', 'blagnac', 'colomiers'],                                    zone: 'Occitanie',                   lat: 43.6047, lng:  1.4442 },
  { id: 'nantes',           nom: 'Nantes',            aliases: ['nantes', 'reze', 'saint nazaire'],                                     zone: 'Pays de la Loire',            lat: 47.2184, lng: -1.5536 },
  { id: 'lille',            nom: 'Lille',             aliases: ['lille', 'roubaix', 'tourcoing', 'villeneuve dascq'],                   zone: 'Hauts-de-France',             lat: 50.6292, lng:  3.0573 },
  { id: 'strasbourg',       nom: 'Strasbourg',        aliases: ['strasbourg', 'bas rhin', 'schiltigheim'],                              zone: 'Grand Est',                   lat: 48.5734, lng:  7.7521 },
  { id: 'montpellier',      nom: 'Montpellier',       aliases: ['montpellier', 'herault'],                                              zone: 'Occitanie',                   lat: 43.6108, lng:  3.8767 },
  { id: 'rennes',           nom: 'Rennes',            aliases: ['rennes', 'ille et vilaine'],                                           zone: 'Bretagne',                    lat: 48.1173, lng: -1.6778 },
  { id: 'grenoble',         nom: 'Grenoble',          aliases: ['grenoble', 'isere', 'meylan'],                                        zone: 'Auvergne-Rhône-Alpes',        lat: 45.1885, lng:  5.7245 },
  { id: 'clermont-ferrand', nom: 'Clermont-Ferrand',  aliases: ['clermont', 'clermont ferrand', 'clfd'],                               zone: 'Auvergne-Rhône-Alpes',        lat: 45.7797, lng:  3.0863 },
  { id: 'rouen',            nom: 'Rouen',             aliases: ['rouen', 'seine maritime'],                                             zone: 'Normandie',                   lat: 49.4431, lng:  1.0993 },
  { id: 'geneve',           nom: 'Genève',            aliases: ['geneve', 'geneva', 'genf', 'genf ch'],                                zone: 'Suisse',                      lat: 46.2044, lng:  6.1432 },
  { id: 'dijon',            nom: 'Dijon',             aliases: ['dijon', 'cote dor', 'bourgogne'],                                     zone: 'Bourgogne-Franche-Comté',     lat: 47.3220, lng:  5.0415 },
  { id: 'tours',            nom: 'Tours',             aliases: ['tours', 'indre et loire'],                                             zone: 'Centre-Val de Loire',         lat: 47.3941, lng:  0.6848 },
  { id: 'orleans',          nom: 'Orléans',           aliases: ['orleans', 'loiret'],                                                   zone: 'Centre-Val de Loire',         lat: 47.9029, lng:  1.9093 },
  { id: 'reims',            nom: 'Reims',             aliases: ['reims', 'marne'],                                                      zone: 'Grand Est',                   lat: 49.2583, lng:  4.0317 },
  { id: 'angers',           nom: 'Angers',            aliases: ['angers', 'maine et loire'],                                            zone: 'Pays de la Loire',            lat: 47.4784, lng: -0.5632 },
  { id: 'avignon',          nom: 'Avignon',           aliases: ['avignon', 'vaucluse'],                                                 zone: 'Provence-Alpes-Côte d\'Azur', lat: 43.9493, lng:  4.8055 },
  { id: 'cannes',           nom: 'Cannes',            aliases: ['cannes', 'antibes', 'juan les pins'],                                  zone: 'Provence-Alpes-Côte d\'Azur', lat: 43.5528, lng:  7.0174 },
  { id: 'toulon',           nom: 'Toulon',            aliases: ['toulon', 'var', 'la seyne'],                                           zone: 'Provence-Alpes-Côte d\'Azur', lat: 43.1242, lng:  5.9280 },
  { id: 'annecy',           nom: 'Annecy',            aliases: ['annecy', 'haute savoie'],                                              zone: 'Auvergne-Rhône-Alpes',        lat: 45.8992, lng:  6.1294 },
  { id: 'chambery',         nom: 'Chambéry',          aliases: ['chambery', 'savoie'],                                                  zone: 'Auvergne-Rhône-Alpes',        lat: 45.5646, lng:  5.9178 },
  { id: 'perpignan',        nom: 'Perpignan',         aliases: ['perpignan', 'pyrenees orientales'],                                    zone: 'Occitanie',                   lat: 42.6986, lng:  2.8956 },
  { id: 'biarritz',         nom: 'Biarritz',          aliases: ['biarritz', 'bayonne', 'anglet'],                                      zone: 'Nouvelle-Aquitaine',          lat: 43.4832, lng: -1.5586 },
  { id: 'la-rochelle',      nom: 'La Rochelle',       aliases: ['la rochelle', 'charente maritime'],                                    zone: 'Nouvelle-Aquitaine',          lat: 46.1603, lng: -1.1511 },
  { id: 'le-mans',          nom: 'Le Mans',           aliases: ['le mans', 'sarthe'],                                                   zone: 'Pays de la Loire',            lat: 48.0061, lng:  0.1996 },
  { id: 'caen',             nom: 'Caen',              aliases: ['caen', 'calvados'],                                                    zone: 'Normandie',                   lat: 49.1829, lng: -0.3707 },
  { id: 'nancy',            nom: 'Nancy',             aliases: ['nancy', 'meurthe et moselle'],                                         zone: 'Grand Est',                   lat: 48.6921, lng:  6.1844 },
  { id: 'metz',             nom: 'Metz',              aliases: ['metz', 'moselle'],                                                     zone: 'Grand Est',                   lat: 49.1193, lng:  6.1727 },
  { id: 'besancon',         nom: 'Besançon',          aliases: ['besancon', 'doubs'],                                                   zone: 'Bourgogne-Franche-Comté',     lat: 47.2378, lng:  6.0241 },
  { id: 'limoges',          nom: 'Limoges',           aliases: ['limoges', 'haute vienne'],                                             zone: 'Nouvelle-Aquitaine',          lat: 45.8336, lng:  1.2611 },
  { id: 'poitiers',         nom: 'Poitiers',          aliases: ['poitiers', 'vienne'],                                                  zone: 'Nouvelle-Aquitaine',          lat: 46.5802, lng:  0.3404 },
  { id: 'brest',            nom: 'Brest',             aliases: ['brest', 'finistere'],                                                  zone: 'Bretagne',                    lat: 48.3905, lng: -4.4860 },
  { id: 'le-havre',         nom: 'Le Havre',          aliases: ['le havre', 'havre', 'seine maritime nord'],                            zone: 'Normandie',                   lat: 49.4944, lng:  0.1079 },
  { id: 'amiens',           nom: 'Amiens',            aliases: ['amiens', 'somme'],                                                     zone: 'Hauts-de-France',             lat: 49.8941, lng:  2.2957 },
  { id: 'nimes',            nom: 'Nîmes',             aliases: ['nimes', 'gard'],                                                       zone: 'Occitanie',                   lat: 43.8367, lng:  4.3601 },
  { id: 'aix-en-provence',  nom: 'Aix-en-Provence',  aliases: ['aix', 'aix en provence'],                                              zone: 'Provence-Alpes-Côte d\'Azur', lat: 43.5297, lng:  5.4474 },
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
}

export function findCity(input: string): City | null {
  const n = normalize(input)
  if (!n) return null
  return (
    CITIES.find(c => normalize(c.nom) === n) ??
    CITIES.find(c => c.aliases.some(a => normalize(a) === n)) ??
    null
  )
}

export function searchCities(query: string, limit = 8): City[] {
  if (!query || query.length < 2) return []
  const n = normalize(query)
  const exact: City[] = []
  const starts: City[] = []
  const includes: City[] = []

  for (const c of CITIES) {
    const cn = normalize(c.nom)
    if (cn === n || c.aliases.some(a => normalize(a) === n)) { exact.push(c); continue }
    if (cn.startsWith(n) || c.aliases.some(a => normalize(a).startsWith(n))) { starts.push(c); continue }
    if (cn.includes(n) || c.aliases.some(a => normalize(a).includes(n))) { includes.push(c) }
  }

  return [...exact, ...starts, ...includes].slice(0, limit)
}
