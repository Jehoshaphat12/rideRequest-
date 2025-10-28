export async function getEstimatedFare(pickup: {lat: number, lng: number}, destination: {lat: number, lng
    : number
}, apiKey: string): Promise<{distanceText: number, durationText: string, price: number} | null> {
    try {
        const response =  await fetch( `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.lat},${pickup.lng}&destination=${destination.lat},${destination.lng}&key=${apiKey}`)

        const data = await response.json()

        if(data.routes.length === 0) return null

        const leg = data.routes[0].legs[0]
        const distanceInMeters = leg.distance.value
        const distanceInKm = distanceInMeters / 1000

        // Example pricing logic: base fare + per km
        const baseFare = 3 // GH 5 base fare
        const perKmRate = 1.35 // GH 2 per km

        const price = baseFare + distanceInKm * perKmRate

        return {
            distanceText: leg.distance.text,
            durationText: leg.duration.text,
            price: parseFloat(price.toFixed(2))
        }
    } catch (error) {
        console.error("Error fetching directions: ", error);
        return null
        
    }
}