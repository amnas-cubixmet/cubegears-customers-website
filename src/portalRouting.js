/** Session-scoped routing; vehicle IDs are selected only from the backend
 * session's authorized vehicle list (not trusted from the URL).
 * No bearer tokens or customer IDs are stored in route state.
 */
export function vehicleUrl(vehicleId) {
  return '/vehicles/' + encodeURIComponent(String(vehicleId));
}

export function dashboardRoute(vehicles, pathname = '/') {
  const allowed = Array.isArray(vehicles) ? vehicles : [];
  if (allowed.length === 1) {
    return { kind: 'vehicle', vehicleId: String(allowed[0].id), path: vehicleUrl(allowed[0].id) };
  }
  const match = /^\/vehicles\/([^/]+)\/?$/.exec(pathname);
  if (match) {
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = ''; }
    const found = allowed.find(vehicle => String(vehicle.id) === id);
    if (found) return { kind: 'vehicle', vehicleId: String(found.id), path: vehicleUrl(found.id) };
  }
  return { kind: 'home', vehicleId: null, path: '/' };
}
