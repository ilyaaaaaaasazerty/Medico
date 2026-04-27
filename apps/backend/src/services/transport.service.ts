import { prisma } from '../lib/prisma.js';
import { TransportType, TransportProviderStatus, TransportReqStatus } from '@prisma/client';

export interface CreateTransportRequest {
    patientId: string;
    type: TransportType;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationAddress?: string;
    destinationLat?: number;
    destinationLng?: number;
    notes?: string;
}

export async function createTransportRequest(data: CreateTransportRequest) {
    // 1. Check for active requests to prevent spam
    const activeRequest = await prisma.transportRequest.findFirst({
        where: {
            patientId: data.patientId,
            status: { in: [TransportReqStatus.PENDING, TransportReqStatus.ACCEPTED, TransportReqStatus.IN_TRANSIT, TransportReqStatus.ARRIVED_PICKUP] }
        }
    });

    if (activeRequest) {
        throw new Error('ACTIVE_REQUEST_EXISTS');
    }

    // 2. Create the request
    const request = await prisma.transportRequest.create({
        data: {
            ...data,
            status: TransportReqStatus.PENDING
        }
    });

    // 3. Find nearby providers
    // We don't automatically assign, but we could return them or notify them via socket
    const nearbyProviders = await getNearbyProviders(data.pickupLat, data.pickupLng, data.type);

    return { request, nearbyProviders };
}

export async function getNearbyProviders(lat: number, lng: number, type: TransportType, radiusKm: number = 10) {
    // Get all available providers of the specific type
    // In a real production app with PostGIS, this would be a single SQL query
    const providers = await prisma.transportProvider.findMany({
        where: {
            type,
            status: TransportProviderStatus.AVAILABLE,
        },
        include: {
            vehicles: true,
            user: {
                select: { email: true, phone: true }
            }
        }
    });

    // Filter by distance using Haversine formula
    return providers.filter(provider => {
        // Assume the first vehicle's location is the provider's location for now
        // Or if the provider model had lat/lng directly. 
        // Based on schema, Vehicle has location, but let's assume active vehicle location is key.
        const vehicle = provider.vehicles.find(v => v.isAvailable); // Get active vehicle
        if (!vehicle || !vehicle.currentLat || !vehicle.currentLng) return false;

        const distance = calculateDistance(lat, lng, vehicle.currentLat, vehicle.currentLng);
        return distance <= radiusKm;
    }).map(p => {
        const vehicle = p.vehicles.find(v => v.isAvailable);
        return {
            ...p,
            distance: calculateDistance(lat, lng, vehicle!.currentLat!, vehicle!.currentLng!)
        };
    }).sort((a, b) => a.distance - b.distance);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export async function updateRequestStatus(requestId: string, providerId: string, status: TransportReqStatus) {
    const updateData: any = { status, providerId };
    
    if (status === TransportReqStatus.ACCEPTED) updateData.acceptedAt = new Date();
    if (status === TransportReqStatus.ARRIVED_PICKUP) updateData.arrivedAt = new Date();
    if (status === TransportReqStatus.COMPLETED) updateData.completedAt = new Date();

    const request = await prisma.transportRequest.update({
        where: { id: requestId },
        data: updateData
    });

    // If completed, free up the provider
    if (status === TransportReqStatus.COMPLETED || status === TransportReqStatus.CANCELLED) {
        await prisma.transportProvider.update({
            where: { id: providerId },
            data: { status: TransportProviderStatus.AVAILABLE }
        });
    }

    return request;
}

export async function updateProviderLocation(providerId: string, lat: number, lng: number) {
    // Update the active vehicle's location
    // We assume the provider has one active vehicle for simplicity in this prototype
    const provider = await prisma.transportProvider.findUnique({
        where: { id: providerId },
        include: { vehicles: true }
    });

    if (!provider || provider.vehicles.length === 0) {
        throw new Error('PROVIDER_OR_VEHICLE_NOT_FOUND');
    }

    const vehicleId = provider.vehicles[0].id; // Simplified

    return prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
            currentLat: lat,
            currentLng: lng
        }
    });
}

export async function toggleProviderStatus(providerId: string, status: TransportProviderStatus) {
    return prisma.transportProvider.update({
        where: { id: providerId },
        data: { status }
    });
}

export async function getPatientActiveRequest(patientId: string) {
    return prisma.transportRequest.findFirst({
        where: {
            patientId,
            status: { notIn: [TransportReqStatus.COMPLETED, TransportReqStatus.CANCELLED] }
        },
        include: {
            provider: {
                include: {
                    user: { select: { email: true, phone: true } },
                    vehicles: true
                }
            }
        }
    });
}

export async function registerTransportProvider(data: any) {
    return prisma.transportProvider.create({ data });
}

