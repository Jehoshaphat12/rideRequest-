import * as Location from "expo-location"
import { useEffect, useState } from "react"

export function useCurrentLocation() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            let {status} = await Location.requestForegroundPermissionsAsync()
            if(status !== "granted") {
                setErrorMsg("Permission to access location was denied")
                return
            }

            let loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            })
            setLocation(loc)
        })()
    }, [])

    return {location, errorMsg}
}