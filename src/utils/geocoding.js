export async function getCoordinates(address) {
  if (!address) return null;
  
  // Clean address: remove "Unknown" or placeholder terms
  const cleanedAddress = address.replace(/Unknown,?\s?/gi, '').trim();
  if (!cleanedAddress || cleanedAddress === 'India') {
    console.warn("Address is too generic or unknown:", address);
    // Fallback to a generic center of India if it's just "India" or empty
    return { lat: 20.5937, lng: 78.9629 };
  }

  console.log(`[Geocoding] Attempting to geocode: "${cleanedAddress}" (Original: "${address}")`);
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedAddress)}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KrishiSetu-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`[Geocoding] Nominatim API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log(`[Geocoding] Success for "${cleanedAddress}":`, { lat: data[0].lat, lng: data[0].lon });
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    console.warn(`[Geocoding] No results for "${cleanedAddress}". Trying broader search...`);

    // If not found, try a broader search (strip the most specific part)
    const parts = cleanedAddress.split(',');
    if (parts.length > 1) {
      // Remove the first part (usually house number or village) and try again
      const broaderAddress = parts.slice(1).join(',').trim();
      return getCoordinates(broaderAddress);
    }
    
    return null;
  } catch (error) {
    console.error(`[Geocoding] Error for address "${address}":`, error);
    return null;
  }
}
