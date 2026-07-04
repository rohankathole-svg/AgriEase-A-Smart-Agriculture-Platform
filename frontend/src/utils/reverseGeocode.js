export async function reverseGeocodeCoordinates(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    latitude
  )}&lon=${encodeURIComponent(longitude)}&addressdetails=1`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to resolve location name");
  }

  const data = await response.json();
  const address = data?.address || {};

  const village =
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.neighbourhood ||
    "";
  const town =
    address.town ||
    address.city ||
    address.municipality ||
    address.city_district ||
    "";
  const district =
    address.state_district ||
    address.county ||
    address.district ||
    address.city_district ||
    "";

  const displayName = [village, town, district].filter(Boolean).join(", ") || data?.display_name || "";

  return {
    displayName,
    village,
    town,
    district,
    raw: data,
  };
}
