import MapboxGL from '@rnmapbox/maps';
import { stationsToGeoJSON } from '@/data/ctaStations';

const STATION_GEOJSON = stationsToGeoJSON();

const LINE_COLORS: Record<string, string> = {
  Red:  '#FF2D55',
  Blue: '#00CFFF',
  Brn:  '#B8860B',
  G:    '#00E676',
  Org:  '#FF6D00',
  P:    '#D500F9',
  Pink: '#FF6B9D',
  Y:    '#FFE500',
};

const COLOR_MATCH: any[] = ['match', ['get', 'line']];
for (const [line, color] of Object.entries(LINE_COLORS)) {
  COLOR_MATCH.push(line, color);
}
COLOR_MATCH.push('#888888');

interface Props {
  visible: boolean;
}

export function CTALayer({ visible }: Props) {
  if (!visible) return null;

  return (
    <MapboxGL.ShapeSource id="cta-source" shape={STATION_GEOJSON}>
      <MapboxGL.CircleLayer
        id="cta-stations"
        style={{
          circleRadius: 5,
          circleColor: COLOR_MATCH,
          circleStrokeWidth: 1.5,
          circleStrokeColor: '#ffffff',
          circleOpacity: 0.95,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
