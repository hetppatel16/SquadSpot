import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Interactive map of a trip (web only; Metro picks this file for web builds
 * and RouteMap.js on iOS/Android).
 *
 * Shows a numbered marker per stop in visiting order, joined by a line, and
 * zooms to fit them all. Map data and tiles come from OpenStreetMap, whose
 * licence requires the "© OpenStreetMap contributors" credit shown on the map.
 *
 * Props: stops — [{ title, time, latitude, longitude }]
 */
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAP_HEIGHT = 340;
const SINGLE_STOP_ZOOM = 15;

// Numbered circles drawn with HTML, so no marker image files are needed.
const numberedIcon = (number) => L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;border-radius:15px;background:#0df269;color:#102217;`
    + `border:2px solid #102217;display:flex;align-items:center;justify-content:center;`
    + `font:bold 14px sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${number}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

const hasCoordinates = (stop) => (
  Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)
  && !(stop.latitude === 0 && stop.longitude === 0)
);

export default function RouteMap({ stops = [] }) {
  const points = useMemo(() => stops.filter(hasCoordinates), [stops]);
  const positions = useMemo(() => points.map((stop) => [stop.latitude, stop.longitude]), [points]);

  if (points.length === 0) return null;

  const viewProps = points.length === 1
    ? { center: positions[0], zoom: SINGLE_STOP_ZOOM }
    : { bounds: positions, boundsOptions: { padding: [36, 36] } };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Route map</Text>
      {/* zIndex 0 keeps Leaflet's own layers below the app's toasts and dialogs. */}
      <View style={styles.mapFrame}>
        <MapContainer {...viewProps} scrollWheelZoom={false} style={{ height: MAP_HEIGHT, width: '100%' }}>
          <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
          {positions.length > 1 && (
            <Polyline positions={positions} pathOptions={{ color: '#0a8f43', weight: 4, opacity: 0.85 }} />
          )}
          {points.map((stop, index) => (
            <Marker key={`${stop.title}-${index}`} position={positions[index]} icon={numberedIcon(index + 1)}>
              <Popup>
                <strong>{index + 1}. {stop.title}</strong>
                <br />
                {stop.time}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>
      <Text style={styles.hint}>Click a number to see the stop. Use + / − or drag to explore.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginTop: 8, marginBottom: 32 },
  heading: {
    color: '#0df269', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 10,
  },
  mapFrame: {
    position: 'relative', zIndex: 0, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(13,242,105,0.3)',
  },
  hint: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 8, textAlign: 'center' },
});
