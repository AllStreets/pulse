import MapboxGL from '@rnmapbox/maps';
import { routesToGeoJSON } from '@/data/ctaRoutes';

const ROUTES_GEOJSON = routesToGeoJSON();

interface Props {
  visible: boolean;
}

export function CTARoutesLayer({ visible }: Props) {
  if (!visible) return null;

  return (
    <MapboxGL.ShapeSource id="cta-routes-source" shape={ROUTES_GEOJSON}>
      {/* White casing behind each line for contrast on dark map */}
      <MapboxGL.LineLayer
        id="cta-routes-casing"
        style={{
          lineColor: '#000000',
          lineWidth: 4.5,
          lineOpacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Colored line */}
      <MapboxGL.LineLayer
        id="cta-routes-line"
        style={{
          lineColor: ['get', 'color'],
          lineWidth: 2.5,
          lineOpacity: 0.75,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
