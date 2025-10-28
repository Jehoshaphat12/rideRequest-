// /services/geocodingService.ts

// Production-ready geocoding service
class GeocodingService {
  private apiKey: string | null = null;
  private baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor() {
    // In production, you would get this from your environment variables
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
  }

  async geocodeAddress(address: string): Promise<{ address: string; lat: number; lng: number }> {
     if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        // Pick the most descriptive address (avoid vague ones)
        const bestResult =
          data.results.find(
            (r: any) =>
              r.types.includes('street_address') ||
              r.types.includes('route') ||
              r.types.includes('locality')
          ) || data.results[0];

        const location = bestResult.geometry.location;
        let formattedAddress = bestResult.formatted_address.replace(/, Ghana$/i, '');

        return {
          address: formattedAddress,
          lat: location.lat,
          lng: location.lng,
        };
      } else if (data.status === 'ZERO_RESULTS') {
        throw new Error('Address not found. Please try a more specific location.');
      } else {
        console.warn('Geocoding failed:', data.status, data.error_message);
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Unable to find location. Please check your connection and try again.');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}?latlng=${lat},${lng}&key=${this.apiKey}`
      );
      
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        let address = data.results[0].formatted_address;
        address = address.replace(/, Ghana$/i, '')
        return address
        // Prefer addresses that include street/locality data over plus codes
      // const bestResult = data.results.find(
      //   (r: any) =>
      //     r.types.includes('street_address') ||
      //     r.types.includes('route') ||
      //     r.types.includes('locality')
      // ) || data.results[0];

      // let address = bestResult.formatted_address;
      // address = address.replace(/, Ghana$/i, '');
      // return address;
      } else {
        throw new Error('Could not get address for this location');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Unable to get address for selected location.');
    }
  }

  // Batch geocoding for multiple addresses
  async batchGeocode(addresses: string[]): Promise<Array<{ address: string; lat: number; lng: number }>> {
    const results = [];
    for (const address of addresses) {
      try {
        const result = await this.geocodeAddress(address);
        results.push(result);
      } catch (error) {
        console.error(`Failed to geocode address: ${address}`, error);
      }
    }
    return results;
  }

  // Validate if address is within service area
  async validateServiceArea(lat: number, lng: number): Promise<boolean> {
    // Implement your business logic for service area validation
    // For example, check if within Accra metropolitan area
    const ACCRA_BOUNDS = {
      north: 5.7,
      south: 5.5,
      east: -0.1,
      west: -0.3,
    };

    return (
      lat >= ACCRA_BOUNDS.south &&
      lat <= ACCRA_BOUNDS.north &&
      lng >= ACCRA_BOUNDS.west &&
      lng <= ACCRA_BOUNDS.east
    );
  }
}

export const geocodingService = new GeocodingService();
export const geocodeAddress = geocodingService.geocodeAddress.bind(geocodingService);
export const reverseGeocode = geocodingService.reverseGeocode.bind(geocodingService);