// services/fareService.ts
export interface FareCalculation {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  currency: string;
  breakdown: {
    base: number;
    perKm: number;
    perMinute: number;
    distance: number;
    duration: number;
  };
}

export interface FareRate {
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  currency: string;
}

export interface DeliveryFareCalculation extends FareCalculation {
  sizeMultiplier: number;
  additionalFees: number;
  deliveryBreakdown: {
    size: string;
    urgent: boolean;
    fragile: boolean;
    sizeMultiplier: number;
    urgencyFee: number;
    fragileFee: number;
  };
}

export interface DeliveryFareRate extends FareRate {
  sizeMultipliers: {
    small: number;
    medium: number;
    large: number;
  };
  urgencyFee: number;
  fragileFee: number;
}

// Default fare rates (in GHS)
const DEFAULT_FARE_RATES: FareRate = {
  baseFare: 2.00,
  perKm: 5.00,
  perMinute: 0.05,
  minimumFare: 5,
  currency: 'GHS'
};

// Delivery-specific fare rates
const DELIVERY_FARE_RATES: DeliveryFareRate = {
  baseFare: 5.00, // Higher base fare for deliveries
  perKm: 5.50,    // Lower per km but with size multipliers
  perMinute: 0.15,
  minimumFare: 7,
  currency: 'GHS',
  sizeMultipliers: {
    small: 1.0,
    medium: 1.3,
    large: 1.7
  },
  urgencyFee: 6.00,
  fragileFee: 4.00
};

export function calculateFare(
  distance: number, // in meters
  duration: number, // in seconds
  fareRates: FareRate = DEFAULT_FARE_RATES
): FareCalculation {
  // Convert to kilometers and minutes
  const distanceKm = distance / 1000;
  const durationMinutes = duration / 60;

  // Calculate components
  const distanceFare = distanceKm * fareRates.perKm;
  const timeFare = durationMinutes * fareRates.perMinute;
  const totalFare = fareRates.baseFare + distanceFare + timeFare;

  // Apply minimum fare
  const finalFare = Math.max(totalFare, fareRates.minimumFare);

  return {
    baseFare: fareRates.baseFare,
    distanceFare,
    timeFare,
    totalFare: finalFare,
    currency: fareRates.currency,
    breakdown: {
      base: fareRates.baseFare,
      perKm: fareRates.perKm,
      perMinute: fareRates.perMinute,
      distance: distanceKm,
      duration: durationMinutes
    }
  };
}

export function calculateDeliveryFare(
  distance: number, // in meters
  duration: number, // in seconds
  packageSize: "small" | "medium" | "large",
  options: {
    urgent?: boolean;
    fragile?: boolean;
    weight?: number;
  } = {},
  fareRates: DeliveryFareRate = DELIVERY_FARE_RATES
): DeliveryFareCalculation {
  // Convert to kilometers and minutes
  const distanceKm = distance / 1000;
  const durationMinutes = duration / 60;

  // Calculate base fare components
  const baseDistanceFare = distanceKm * fareRates.perKm;
  const timeFare = durationMinutes * fareRates.perMinute;
  
  // Apply size multiplier
  const sizeMultiplier = fareRates.sizeMultipliers[packageSize];
  const sizeAdjustedFare = (fareRates.baseFare + baseDistanceFare) * sizeMultiplier + timeFare;

  // Calculate additional fees
  let additionalFees = 0;
  if (options.urgent) additionalFees += fareRates.urgencyFee;
  if (options.fragile) additionalFees += fareRates.fragileFee;

  const totalFare = sizeAdjustedFare + additionalFees;

  // Apply minimum fare
  const finalFare = Math.max(totalFare, fareRates.minimumFare);

  return {
    baseFare: fareRates.baseFare,
    distanceFare: baseDistanceFare,
    timeFare,
    totalFare: finalFare,
    currency: fareRates.currency,
    sizeMultiplier,
    additionalFees,
    breakdown: {
      base: fareRates.baseFare,
      perKm: fareRates.perKm,
      perMinute: fareRates.perMinute,
      distance: distanceKm,
      duration: durationMinutes
    },
    deliveryBreakdown: {
      size: packageSize,
      urgent: options.urgent || false,
      fragile: options.fragile || false,
      sizeMultiplier,
      urgencyFee: options.urgent ? fareRates.urgencyFee : 0,
      fragileFee: options.fragile ? fareRates.fragileFee : 0
    }
  };
}

// Unified fare calculation that automatically detects service type
export function calculateServiceFare(
  serviceType: 'ride' | 'delivery',
  distance: number,
  duration: number,
  deliveryOptions?: {
    packageSize?: "small" | "medium" | "large";
    urgent?: boolean;
    fragile?: boolean;
    weight?: number;
  }
): FareCalculation | DeliveryFareCalculation {
  if (serviceType === 'delivery') {
    if (!deliveryOptions?.packageSize) {
      throw new Error('Package size is required for delivery fare calculation');
    }
    return calculateDeliveryFare(
      distance,
      duration,
      deliveryOptions.packageSize,
      {
        urgent: deliveryOptions.urgent,
        fragile: deliveryOptions.fragile,
        weight: deliveryOptions.weight
      }
    );
  } else {
    return calculateFare(distance, duration);
  }
}

// Helper to extract distance and duration from Google Directions response
export function extractDistanceAndDuration(routeData: any): { distance: number; duration: number } {
  if (!routeData?.routes?.[0]?.legs?.[0]) {
    throw new Error('Invalid route data');
  }

  const leg = routeData.routes[0].legs[0];
  return {
    distance: leg.distance.value, // in meters
    duration: leg.duration.value   // in seconds
  };
}

// Calculate distance and duration between two points (simplified version)
export async function calculateRouteDetails(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): Promise<{ distance: number; duration: number }> {
  // Simple haversine distance calculation as fallback
  // In production, you'd use Google Directions API
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (pickup.lat * Math.PI) / 180;
  const φ2 = (dropoff.lat * Math.PI) / 180;
  const Δφ = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
  const Δλ = ((dropoff.lng - pickup.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  
  // Estimate duration based on distance (assuming average speed of 40km/h)
  const averageSpeedKmh = 40;
  const duration = (distance / 1000) / averageSpeedKmh * 3600; // Duration in seconds

  return { distance, duration };
}

// Format currency for display
export function formatFare(fare: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(fare);
}

// Format fare with service type indicator
export function formatServiceFare(
  fare: number, 
  serviceType: 'ride' | 'delivery' = 'ride', 
  currency: string = 'GHS'
): string {
  const symbol = serviceType === 'delivery' ? '🚚' : '🚖';
  const formattedFare = formatFare(fare, currency);
  return `${symbol} ${formattedFare}`;
}

// Get fare breakdown description for display
export function getFareBreakdownDescription(calculation: FareCalculation | DeliveryFareCalculation): string[] {
  const breakdown: string[] = [];
  
  breakdown.push(`Base fare: ${formatFare(calculation.baseFare)}`);
  breakdown.push(`Distance (${calculation.breakdown.distance.toFixed(1)} km): ${formatFare(calculation.distanceFare)}`);
  breakdown.push(`Time (${calculation.breakdown.duration.toFixed(0)} min): ${formatFare(calculation.timeFare)}`);

  // Add delivery-specific breakdown if available
  if ('deliveryBreakdown' in calculation) {
    const deliveryCalc = calculation as DeliveryFareCalculation;
    
    if (deliveryCalc.deliveryBreakdown.sizeMultiplier !== 1) {
      breakdown.push(`Size (${deliveryCalc.deliveryBreakdown.size}): ${deliveryCalc.deliveryBreakdown.sizeMultiplier}x multiplier`);
    }
    
    if (deliveryCalc.deliveryBreakdown.urgencyFee > 0) {
      breakdown.push(`Urgent delivery: +${formatFare(deliveryCalc.deliveryBreakdown.urgencyFee)}`);
    }
    
    if (deliveryCalc.deliveryBreakdown.fragileFee > 0) {
      breakdown.push(`Fragile handling: +${formatFare(deliveryCalc.deliveryBreakdown.fragileFee)}`);
    }
    
    if (deliveryCalc.additionalFees > 0) {
      breakdown.push(`Additional fees: ${formatFare(deliveryCalc.additionalFees)}`);
    }
  }

  breakdown.push(`Total: ${formatFare(calculation.totalFare)}`);
  
  return breakdown;
}

// Validate if a fare calculation meets minimum requirements
export function validateFareCalculation(calculation: FareCalculation | DeliveryFareCalculation): boolean {
  return calculation.totalFare >= calculation.breakdown.base;
}

// Export fare rate constants for use in other parts of the app
export { DEFAULT_FARE_RATES, DELIVERY_FARE_RATES };

