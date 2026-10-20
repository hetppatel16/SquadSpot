/**
 * Mobile stand-in for the trip map.
 *
 * The interactive map is web-only (RouteMap.web.js uses Leaflet, which needs a
 * browser), so on iOS/Android this renders nothing and the trip page relies on
 * "Navigate This Route" to open Google Maps.
 *
 * To show a map in the mobile app: install react-native-maps
 * (`npx expo install react-native-maps`) and implement this component with
 * <MapView>, one <Marker> per stop and a <Polyline> through them, using the
 * same `stops` prop ({ title, time, latitude, longitude }).
 */
export default function RouteMap() {
  return null;
}
