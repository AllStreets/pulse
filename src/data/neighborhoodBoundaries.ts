// GeoJSON polygon rings [lng, lat] order
// More precise Chicago neighborhood boundaries with additional vertices
// following street diagonals (Milwaukee Ave, Clybourn, Blue Island, Lincoln Ave)
export const NEIGHBORHOOD_BOUNDARIES: Record<string, GeoJSON.Polygon> = {
  'wicker-park': {
    type: 'Polygon',
    coordinates: [[
      [-87.6876, 41.9033], // Western & Division (SW)
      [-87.6779, 41.9033], // Damen & Division (SE)
      [-87.6779, 41.9055], // Damen heading north toward North Ave
      [-87.6730, 41.9072], // Damen toward 6-corners
      [-87.6693, 41.9094], // 6-corners: Damen/North/Milwaukee
      [-87.6730, 41.9120], // up Milwaukee diagonal
      [-87.6760, 41.9148], // Bloomingdale heading west
      [-87.6876, 41.9148], // Western & Bloomingdale (NW)
      [-87.6876, 41.9033], // close
    ]],
  },
  'logan-square': {
    type: 'Polygon',
    coordinates: [[
      [-87.7261, 41.9148], // Pulaski & Armitage (SW)
      [-87.7066, 41.9148], // Kedzie & Armitage
      [-87.6944, 41.9178], // California & Armitage
      [-87.6876, 41.9222], // Western area — Milwaukee diagonal cuts SE
      [-87.6946, 41.9289], // California & Diversey
      [-87.7017, 41.9348], // Kedzie & Diversey
      [-87.7152, 41.9348], // heading west on Diversey
      [-87.7261, 41.9289], // Pulaski & ~Belden
      [-87.7261, 41.9148], // close
    ]],
  },
  'river-north': {
    type: 'Polygon',
    coordinates: [[
      [-87.6408, 41.8858], // Wells & Kinzie — south edge along river (SW)
      [-87.6350, 41.8840], // Orleans & Kinzie
      [-87.6312, 41.8840], // Clark & Kinzie (SE)
      [-87.6241, 41.8858], // Michigan Ave/Grand (SE)
      [-87.6222, 41.8910], // Michigan curves northward
      [-87.6241, 41.8965], // Michigan & Chicago Ave (NE)
      [-87.6280, 41.8965], // Chicago Ave heading west
      [-87.6355, 41.8965], // Clark & Chicago Ave
      [-87.6408, 41.8940], // Orleans & Superior
      [-87.6408, 41.8858], // close
    ]],
  },
  'wrigleyville': {
    type: 'Polygon',
    coordinates: [[
      [-87.6644, 41.9394], // Ashland & Belmont (SW)
      [-87.6532, 41.9394], // Clark & Belmont — Wrigley is at Clark/Addison
      [-87.6388, 41.9415], // Sheffield curves toward Addison
      [-87.6355, 41.9467], // Clark & Addison (Wrigley Field)
      [-87.6355, 41.9510], // Clark & Grace
      [-87.6420, 41.9543], // Clark & Irving Park (NE)
      [-87.6532, 41.9543], // Racine & Irving Park
      [-87.6644, 41.9503], // Ashland & Grace
      [-87.6644, 41.9394], // close
    ]],
  },
  'pilsen': {
    type: 'Polygon',
    coordinates: [[
      [-87.6876, 41.8609], // Western & 16th St (NW)
      [-87.6760, 41.8609], // heading east on 16th
      [-87.6629, 41.8609], // Halsted & 16th
      [-87.6529, 41.8575], // Blue Island diagonal heads SE
      [-87.6471, 41.8520], // Halsted & 18th
      [-87.6471, 41.8452], // Halsted & Cermak (SE)
      [-87.6629, 41.8396], // Cermak heading west
      [-87.6760, 41.8396], // Western & Cermak
      [-87.6876, 41.8452], // Western heading north
      [-87.6876, 41.8609], // close
    ]],
  },
  'west-loop': {
    type: 'Polygon',
    coordinates: [[
      [-87.6644, 41.8750], // Ashland & Lake St (NW)
      [-87.6500, 41.8752], // Halsted & Lake
      [-87.6408, 41.8858], // Clinton & Lake / near Loop approach
      [-87.6355, 41.8850], // Canal & Lake heading toward river
      [-87.6355, 41.8762], // Canal & Congress (NE lower)
      [-87.6391, 41.8675], // Canal & Roosevelt (SE)
      [-87.6500, 41.8643], // Ogden Ave cuts diagonal
      [-87.6560, 41.8643], // continuing Ogden diagonal
      [-87.6644, 41.8675], // Ashland & Roosevelt (SW)
      [-87.6644, 41.8750], // close
    ]],
  },
  'streeterville': {
    type: 'Polygon',
    coordinates: [[
      [-87.6251, 41.8873], // Michigan Ave & Grand (SW)
      [-87.6213, 41.8858], // Columbus Dr approaching river
      [-87.6175, 41.8863], // Lake Shore Dr approach from S
      [-87.6145, 41.8900], // Lake Shore Dr heading north
      [-87.6145, 41.9010], // Lake Shore Dr & Oak St (NE)
      [-87.6180, 41.9030], // Navy Pier blvd
      [-87.6213, 41.9015], // Michigan Ave & Oak St (NW)
      [-87.6251, 41.8965], // Michigan Ave heading south
      [-87.6251, 41.8873], // close
    ]],
  },
  'lincoln-park': {
    type: 'Polygon',
    coordinates: [[
      [-87.6593, 41.9078], // Clybourn & Armitage (SW diagonal start)
      [-87.6532, 41.9078], // Clark & Armitage
      [-87.6390, 41.9094], // Clark heading toward Fullerton
      [-87.6355, 41.9160], // Clark & Fullerton area
      [-87.6350, 41.9228], // Clark & Webster
      [-87.6350, 41.9321], // Clark & Diversey (NE)
      [-87.6480, 41.9321], // Racine & Diversey
      [-87.6532, 41.9321], // heading to Halsted at Diversey
      [-87.6593, 41.9253], // Clybourn heading SW
      [-87.6660, 41.9181], // Clybourn & Armitage area
      [-87.6593, 41.9078], // close
    ]],
  },
  'south-loop': {
    type: 'Polygon',
    coordinates: [[
      [-87.6390, 41.8762], // Wells & Congress Pkwy (NW)
      [-87.6280, 41.8762], // State & Congress
      [-87.6241, 41.8762], // Michigan & Congress Pkwy (NE)
      [-87.6175, 41.8700], // Michigan Ave heading south
      [-87.6175, 41.8609], // Michigan & 18th
      [-87.6145, 41.8575], // Museum Campus / Lake Shore Dr (SE)
      [-87.6175, 41.8530], // heading south along lake
      [-87.6300, 41.8531], // 18th heading west
      [-87.6390, 41.8560], // Wells & 18th (SW)
      [-87.6390, 41.8762], // close
    ]],
  },
  'bucktown': {
    type: 'Polygon',
    coordinates: [[
      [-87.7000, 41.9148], // Western & Bloomingdale (SW)
      [-87.6876, 41.9148], // heading east on Bloomingdale
      [-87.6813, 41.9148], // Damen & Bloomingdale
      [-87.6750, 41.9148], // Damen heading north
      [-87.6693, 41.9181], // Damen & Webster (jog via Lincoln Ave diagonal)
      [-87.6750, 41.9240], // back to Damen at Fullerton
      [-87.6750, 41.9253], // Damen & Fullerton
      [-87.7000, 41.9253], // Western & Fullerton (NW)
      [-87.7000, 41.9148], // close
    ]],
  },
  'andersonville': {
    type: 'Polygon',
    coordinates: [[
      [-87.6790, 41.9720], // Ravenswood & Foster (SW)
      [-87.6703, 41.9720], // Clark & Foster (SE via Ravenswood el)
      [-87.6548, 41.9720], // Clark & Foster (SE)
      [-87.6480, 41.9750], // Clark heading north — Berwyn area
      [-87.6480, 41.9860], // Clark & Bryn Mawr
      [-87.6590, 41.9900], // Berwyn heading west (NE area)
      [-87.6703, 41.9900], // Ravenswood el & Bryn Mawr
      [-87.6790, 41.9860], // Ravenswood heading south
      [-87.6790, 41.9720], // close
    ]],
  },
  'hyde-park': {
    type: 'Polygon',
    coordinates: [[
      [-87.6150, 41.8020], // Cottage Grove & 51st (NW)
      [-87.5940, 41.8020], // Martin Luther King & 51st
      [-87.5850, 41.7980], // heading toward lake
      [-87.5720, 41.7950], // Lake Shore Dr curves south
      [-87.5720, 41.7840], // Lake Shore Dr & 60th (SE)
      [-87.5850, 41.7800], // 60th heading west
      [-87.6150, 41.7800], // Cottage Grove & 60th (SW)
      [-87.6150, 41.8020], // close
    ]],
  },
  'old-town': {
    type: 'Polygon',
    coordinates: [[
      [-87.6480, 41.9033], // Sedgwick & Division (SW)
      [-87.6355, 41.9033], // Clark & Division (SE)
      [-87.6275, 41.9040], // Clark heading north — slight jog
      [-87.6241, 41.9094], // Clark & North Ave (NE)
      [-87.6275, 41.9140], // Clark & Schiller
      [-87.6355, 41.9181], // Clark & Armitage
      [-87.6480, 41.9181], // Sedgwick & Armitage (NW)
      [-87.6480, 41.9094], // Sedgwick & North Ave
      [-87.6480, 41.9033], // close
    ]],
  },
};
