import axios from "axios";
import { useEffect, useState } from "react";

type Props = {
    lat: number,
    lng: number,

}

export function useRoute(start: Props, end: Props) {
    const [coords, setCoords] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if(!start || !end) return
        setLoading(true)

        const fetchRoute = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
                const res = await axios.get(url)
                const route = res.data.routes[0].geometry.coordinates.map((c: number[]) => ({
                    latitude: c[1],
                    longitude: c[0]
                }))
                setCoords(route)
            } catch (err) {
                console.error("Error fetching route: ", err)
            } finally {
                setLoading(false)
            }
        }
        fetchRoute()
    }, [start, end])

    return {coords, loading}
}