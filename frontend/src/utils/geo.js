/** Straight-line (Haversine) distance in kilometres between two {latitude, longitude} points. */
export function distanceKm(a, b) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** The city closest to `point`, as { city, km }, or null for an empty list. */
export function nearestCity(cities, point) {
  return cities.reduce((best, city) => {
    const km = distanceKm(point, { latitude: Number(city.latitude), longitude: Number(city.longitude) });
    return !best || km < best.km ? { city, km } : best;
  }, null);
}
