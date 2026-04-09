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
  'streeterville': {
    // East of Michigan Ave, bounded by the Chicago River (south), Oak St (north),
    // and Lake Shore Dr / Lake Michigan (east)
    type: 'Polygon',
    coordinates: [[
      [-87.6251, 41.8874], // Michigan Ave & Grand (SW)
      [-87.6195, 41.8863], // Columbus Dr & Grand (SE)
      [-87.6145, 41.8900], // Lake Shore Dr heading north
      [-87.6145, 41.9010], // Lake Shore Dr & Oak St (NE)
      [-87.6213, 41.9015], // Michigan Ave & Oak St (NW)
      [-87.6251, 41.8965], // Michigan Ave heading south
      [-87.6251, 41.8874], // close
    ]],
  },
  'lincoln-park': {
    // DePaul/Sheffield village; Clybourn diag SW edge; lakefront park on east;
    // Fullerton (south) and Diversey (north) are main cross-streets
    type: 'Polygon',
    coordinates: [[
      [-87.6660, 41.9078], // Clybourn & Armitage (SW — diagonal start)
      [-87.6500, 41.9078], // Clark & Armitage (SE)
      [-87.6390, 41.9158], // Clark & Fullerton (east edge jogs)
      [-87.6350, 41.9230], // Clark & Wrightwood
      [-87.6350, 41.9330], // Clark & Diversey (NE)
      [-87.6550, 41.9330], // Racine & Diversey (NW)
      [-87.6660, 41.9250], // Clybourn heading south (NW diagonal)
      [-87.6660, 41.9078], // close
    ]],
  },
  'south-loop': {
    // South of Congress Pkwy, west of Lake Shore Dr, east of the rail yards;
    // Museum Campus occupies the southeast tip
    type: 'Polygon',
    coordinates: [[
      [-87.6390, 41.8762], // Wells & Congress Pkwy (NW)
      [-87.6241, 41.8762], // Michigan & Congress Pkwy (NE)
      [-87.6175, 41.8700], // Michigan Ave heading south
      [-87.6145, 41.8620], // Museum Campus / Lake Shore Dr (SE)
      [-87.6300, 41.8570], // 18th St heading west
      [-87.6390, 41.8600], // Wells & 18th (SW)
      [-87.6390, 41.8762], // close
    ]],
  },
  'bucktown': {
    // Directly north of Wicker Park; Bloomingdale Trail on south; Fullerton on north;
    // Western (west) and Damen (east) are the main north-south borders
    type: 'Polygon',
    coordinates: [[
      [-87.7000, 41.9148], // Western & Bloomingdale (SW)
      [-87.6750, 41.9148], // Damen & Bloomingdale (SE)
      [-87.6750, 41.9200], // Damen heading north
      [-87.6693, 41.9240], // Damen & Webster (jog east)
      [-87.6750, 41.9290], // back to Damen at Fullerton
      [-87.7000, 41.9290], // Western & Fullerton (NW)
      [-87.7000, 41.9148], // close
    ]],
  },
  'andersonville': {
    // Swedish/LGBTQ+ enclave on north Clark St; Foster Ave (south) to Bryn Mawr (north);
    // Ravenswood (west) to Winthrop/Kenmore (east, near el tracks)
    type: 'Polygon',
    coordinates: [[
      [-87.6790, 41.9720], // Ravenswood & Foster (SW)
      [-87.6530, 41.9720], // Clark & Foster (SE)
      [-87.6530, 41.9900], // Clark & Bryn Mawr (NE)
      [-87.6680, 41.9900], // Ravenswood & Bryn Mawr (NW, follows el)
      [-87.6790, 41.9830], // Ravenswood heading south
      [-87.6790, 41.9720], // close
    ]],
  },
  'hyde-park': {
    // University of Chicago neighborhood; 51st (north) to 60th/Midway (south);
    // Cottage Grove (west) to Lake Shore Dr (east)
    type: 'Polygon',
    coordinates: [[
      [-87.6150, 41.8020], // Cottage Grove & 51st (NW)
      [-87.5850, 41.8020], // 51st heading east (NE)
      [-87.5720, 41.7950], // Lake Shore Dr curves south
      [-87.5720, 41.7840], // Lake Shore Dr & 60th (SE)
      [-87.6150, 41.7840], // Cottage Grove & 60th (SW)
      [-87.6150, 41.8020], // close
    ]],
  },
  'old-town': {
    // Wells St corridor; Division (south) to Armitage (north);
    // Sedgwick (west) to Clark (east); tight grid neighborhood
    type: 'Polygon',
    coordinates: [[
      [-87.6480, 41.9040], // Sedgwick & Division (SW)
      [-87.6275, 41.9040], // Clark & Division (SE)
      [-87.6275, 41.9060], // Clark heading north
      [-87.6240, 41.9100], // Clark & North Ave (NE jog)
      [-87.6275, 41.9160], // Clark & Armitage
      [-87.6480, 41.9200], // Sedgwick & Armitage (NW)
      [-87.6480, 41.9040], // close
    ]],
  },
};
