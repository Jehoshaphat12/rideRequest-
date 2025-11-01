// // services/mapService.ts
// const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

import { calculateFare, extractDistanceAndDuration, FareCalculation } from "./fareService";

// export interface Location {
//   latitude: number;
//   longitude: number;
//   address?: string
// }

// export interface Route {
//   distance: string;
//   duration: string;
//   coordinates: Location[];
// }

// export async function getRoute(
//   origin: Location,
//   destination: Location
// ): Promise<Route> {
//   const originStr = `${origin.latitude},${origin.longitude}`;
//   const destinationStr = `${destination.latitude},${destination.longitude}`;

//   const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_API_KEY}`;

//   try {
//     const response = await fetch(url);
//     const data = await response.json();

//     if (data.status !== 'OK') {
//       throw new Error(`Directions API error: ${data.status}`);
//     }

//     const route = data.routes[0];
//     const leg = route.legs[0];

//     // Extract polyline points
//     const points = decodePolyline(route.overview_polyline.points);

//     return {
//       distance: leg.distance.text,
//       duration: leg.duration.text,
//       coordinates: points,
//     };
//   } catch (error) {
//     console.error('Error fetching route:', error);
//     throw error;
//   }
// }

// // Decode Google Maps polyline
// function decodePolyline(encoded: string): Location[] {
//   const points = [];
//   let index = 0;
//   const len = encoded.length;
//   let lat = 0;
//   let lng = 0;

//   while (index < len) {
//     let b;
//     let shift = 0;
//     let result = 0;
//     do {
//       b = encoded.charCodeAt(index++) - 63;
//       result |= (b & 0x1f) << shift;
//       shift += 5;
//     } while (b >= 0x20);
//     const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//     lat += dlat;

//     shift = 0;
//     result = 0;
//     do {
//       b = encoded.charCodeAt(index++) - 63;
//       result |= (b & 0x1f) << shift;
//       shift += 5;
//     } while (b >= 0x20);
//     const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//     lng += dlng;

//     points.push({
//       latitude: lat * 1e-5,
//       longitude: lng * 1e-5,
//     });
//   }

//   return points;
// }



// services/mapService.ts
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Route {
  distance: string;
  duration: string;
  rawData: any
  coordinates: Location[]
  bounds: {
    northeast: Location
    southwest: Location
  }
}
export interface RouteWithFare {
  distance: string;
  duration: string;
  fare: FareCalculation
  rawData: any
  coordinates: Location[]
  bounds: {
    northeast: Location
    southwest: Location
  }
}

export async function getCurrentLocationAddress(location: Location): Promise<string> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    throw new Error('No address found for location');
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    throw error;
  }
}

// Alternative: Get a shorter address (street level)
export async function getShortAddress(location: Location): Promise<string> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      // Try to get a shorter, more readable address
      const result = data.results[0];
      return result.formatted_address;
      
      // Alternative: Get just the street address
      // const addressComponents = result.address_components;
      // const street = addressComponents.find(comp => comp.types.includes('route'));
      // const number = addressComponents.find(comp => comp.types.includes('street_number'));
      // return `${number ? number.long_name + ' ' : ''}${street ? street.long_name : result.formatted_address}`;
    }
    throw new Error('No address found for location');
  } catch (error) {
    console.error('Error getting short address:', error);
    throw error;
  }
}

export async function getRouteWithFare(
  origin: Location,
  destination: Location
): Promise<RouteWithFare> {
  try {
    const routeData = await getRoute(origin, destination);
    const { distance, duration } = extractDistanceAndDuration(routeData.rawData);
    const fare = calculateFare(distance, duration);

    return {
      ...routeData,
      fare,
      rawData: routeData.rawData
    };
  } catch (error) {
    console.error('Error getting route with fare:', error);
    throw error;
  }
}

export async function getRoute(origin: Location, destination: Location): Promise<Route> {
  const modes = ["two_wheeler", "driving"]
  try {
    const originStr = `${origin.latitude}, ${origin.longitude}`
    const destinationStr = `${destination.latitude}, ${destination.longitude}`

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=two_wheeler&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url)
    const data = await response.json()

    if(data.status !== "OK") {
      throw new Error(`Directions API error: ${data.status}`)
    }

    const route = data.routes[0]
    const leg = route.legs[0]

    // Extract polyline points
    const points = decodePolyline(route.overview_polyline.points)

    // Get bounds for map fitting
    const bounds = {
      northeast: {
        latitude: route.bounds.northeast.lat,
        longitude: route.bounds.northeast.lat
      },
      southwest: {
        latitude: route.bounds.southwest.lat,
        longitude: route.bounds.southwest.lng
      }
    }

    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
      coordinates: points,
      bounds: bounds,
      rawData: data
    }
  } catch (error) {
    console.error("Error fetching route: ", error)
    throw error
  }
}

// Decode Google Maps polyline
export function decodePolyline(encoded: string): Location[] {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return points;
}

// Keep your existing functions...
// export async function getCurrentLocationAddress(location: Location): Promise<string> {
//   try {
//     const response = await fetch(
//       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_API_KEY}`
//     );
//     const data = await response.json();
    
//     if (data.status === 'OK' && data.results.length > 0) {
//       return data.results[0].formatted_address;
//     }
//     throw new Error('No address found for location');
//   } catch (error) {
//     console.error('Error getting address from coordinates:', error);
//     throw error;
//   }
// }