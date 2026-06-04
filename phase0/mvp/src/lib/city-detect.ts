/**
 * City gate — Sisters in Dua MVP.
 *
 * The cluster is currently scoped to women in **Hyderabad metropolitan area**:
 * Hyderabad city, Secunderabad, Cyberabad / HITEC City, Rangareddy, and
 * Medchal-Malkajgiri. We treat these as one logical region.
 *
 * No GPS. No IP geolocation. No coordinates anywhere. Self-declaration is
 * the only gate — privacy is the load-bearing principle for this product
 * and storing a coordinate against an account would compromise that.
 *
 * The DB column today is `profiles.country` (legacy from the pre-Hyderabad
 * MVP). We continue to use that column to avoid a migration; the value
 * stored is the city string. Rename to `profiles.city` is a future
 * cleanup, not in scope here.
 */

/**
 * The city values we accept past the gate. Storing the canonical
 * "Hyderabad" string for any of these lets admin queries treat the
 * cluster as a single logical region.
 */
export const HYDERABAD_METRO_CANONICAL = "Hyderabad";

/**
 * Whether a stored location string represents a member who passed the
 * city gate. Anything else is a non-fit.
 */
export function isHyderabadMetro(location: string | null): boolean {
  return location === HYDERABAD_METRO_CANONICAL;
}

/**
 * Human-readable list of areas included in "Hyderabad metro". Used in
 * onboarding copy so a sister in Secunderabad or Madhapur knows she's in
 * scope without us forcing her to pick the exact suburb.
 */
export const HYDERABAD_METRO_AREAS = [
  "Hyderabad",
  "Secunderabad",
  "Cyberabad / HITEC City",
  "Rangareddy",
  "Medchal-Malkajgiri",
];
