// GeoJSON polygon rings [lng, lat] order (standard GeoJSON, not [lat, lng])
// Accurate Chicago neighborhood boundary approximations following real street geometry
export const NEIGHBORHOOD_BOUNDARIES: Record<string, GeoJSON.Polygon> = {
  'wicker-park': {
    // Follows Milwaukee Ave diagonal on the east — the 6-corners (Milwaukee/Damen/North) gives
    // Wicker Park its distinctive angled northeast edge
    type: 'Polygon',
    coordinates: [[
      [-87.6876, 41.9033], // Western & Division (SW)
      [-87.6779, 41.9033], // Damen & Division (SE)
      [-87.6779, 41.9094], // Damen & North Ave — 6-corners
      [-87.6693, 41.9094], // North Ave toward Clybourn (jog east)
      [-87.6730, 41.9148], // up Milwaukee diagonal to Bloomingdale
      [-87.6813, 41.9148], // Bloomingdale heading west
      [-87.6876, 41.9148], // Western & Bloomingdale (NW)
      [-87.6876, 41.9033], // close
    ]],
  },
  'logan-square': {
    // Milwaukee Ave and Logan Blvd radiate from the Logan Square circle,
    // giving the south/east edge a distinctive diagonal cut
    type: 'Polygon',
    coordinates: [[
      [-87.7261, 41.9178], // Pulaski & Armitage (SW)
      [-87.6944, 41.9178], // California & Armitage (SE)
      [-87.6876, 41.9222], // Western & ~Cortland (angled SE corner via Milwaukee)
      [-87.6946, 41.9289], // California & Diversey
      [-87.7017, 41.9348], // Kedzie & Diversey (NE)
      [-87.7152, 41.9348], // heading west on Diversey
      [-87.7261, 41.9289], // Pulaski angling SW
      [-87.7261, 41.9178], // close
    ]],
  },
  'river-north': {
    // Chicago River cuts the south boundary at an angle; Michigan Ave curves near the lakefront
    type: 'Polygon',
    coordinates: [[
      [-87.6385, 41.8860], // Wells & Kinzie (SW)
      [-87.6312, 41.8841], // river curves toward Michigan (SE notch)
      [-87.6241, 41.8860], // Michigan Ave & Grand (SE)
      [-87.6222, 41.8910], // Michigan curves northward
      [-87.6241, 41.8965], // Michigan & Chicago Ave (NE)
      [-87.6350, 41.8965], // Chicago Ave heading west
      [-87.6385, 41.8940], // Orleans & Superior
      [-87.6385, 41.8860], // close
    ]],
  },
  'wrigleyville': {
    // Clark St runs at a slight angle (NNW); Sheridan curves near the lakefront;
    // Wrigley Field sits at Clark & Addison, offsetting the south-east corner
    type: 'Polygon',
    coordinates: [[
      [-87.6644, 41.9394], // Ashland & Belmont (SW)
      [-87.6500, 41.9394], // Belmont heading east
      [-87.6388, 41.9430], // Sheridan curves in near Diversey (SE notch)
      [-87.6388, 41.9467], // Sheridan & Addison
      [-87.6500, 41.9510], // Addison heading west
      [-87.6556, 41.9543], // Clark & Irving Park (NW area)
      [-87.6644, 41.9503], // Racine & Grace
      [-87.6644, 41.9394], // close
    ]],
  },
  'pilsen': {
    // Blue Island Ave cuts diagonally across Pilsen; Cermak/22nd angles SW;
    // the Chicago River borders the north-east corner
    type: 'Polygon',
    coordinates: [[
      [-87.6876, 41.8609], // Western & 16th St (NW)
      [-87.6629, 41.8609], // Halsted & 16th St area
      [-87.6471, 41.8565], // Halsted angling south (NE)
      [-87.6471, 41.8487], // Halsted & Cermak (SE)
      [-87.6629, 41.8452], // Cermak heading west via Blue Island angle
      [-87.6820, 41.8452], // Western & Cermak area
      [-87.6876, 41.8487], // Western heading north
      [-87.6876, 41.8609], // close
    ]],
  },
  'west-loop': {
    // Rail yards and the Chicago River create irregular east/north boundaries;
    // Ogden Ave cuts diagonally across the SW corner
    type: 'Polygon',
    coordinates: [[
      [-87.6644, 41.8675], // Ashland & Roosevelt (SW)
      [-87.6560, 41.8643], // Ogden Ave diagonal (angled SW cut)
      [-87.6391, 41.8675], // Canal & Roosevelt (SE)
      [-87.6355, 41.8740], // Canal heads north — narrows near rail yard
      [-87.6391, 41.8852], // Canal & Lake St (NE)
      [-87.6500, 41.8910], // Halsted & Grand (notch NW above rail yard)
      [-87.6644, 41.8852], // Ashland & Lake St (NW)
      [-87.6644, 41.8675], // close
    ]],
  },
};
