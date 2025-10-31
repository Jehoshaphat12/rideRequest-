// src/types/serviceRequests.ts

export type ServiceType = "ride" | "delivery";

export type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type PackageSize = "small" | "medium" | "large";

export interface Location {
  address: string;
  lat: number;
  lng: number;
  contact?: {
    name: string;
    phone: string;
  };
}

export interface DropoffLocation {
  address: string;
  lat: number;
  lng: number;
  contact: {
    name: string;
    phone: string;
  };
}

export interface PackageDetails {
  size: PackageSize;
  description?: string;
  fragile?: boolean;
  weight?: number;
}

export interface PassengerInfo {
  name?: string;
  profilePicture?: string;
  rating?: number;
  totalRides?: number;
}

// Base interface for common properties
interface BaseServiceRequest {
  id: string;
  status: string;
  createdAt: any;
  estimatedFare?: number;
  estimatedDuration?: string;
  estimatedDistance?: string;
  customerId: string;
  receivedAt: string;
}

export interface DeliveryRequest extends BaseServiceRequest {
  type: "delivery";
  pickup: Location;
  dropoff: DropoffLocation;
  packageDetails: PackageDetails;
  passengerId: string,
  status: DeliveryStatus;
  urgent: boolean;
}

export interface RideRequest extends BaseServiceRequest {
  type: "ride";
  pickup: any; // You might want to refine this to a specific type
  dropoff: any; // You might want to refine this to a specific type
  passengerId: string;
  passengerInfo?: PassengerInfo;
  riderId: string
}

export type ServiceRequest = RideRequest | DeliveryRequest;

// For map locations
export interface MapLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface MapLocations {
  pickupLocation: MapLocation;
  destinationLocation: MapLocation;
  showRoute: boolean;
}