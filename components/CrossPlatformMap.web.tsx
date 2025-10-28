// "use client";

// import React, { Suspense } from "react";
// import { MapProps } from "./CrossPlatformMap.types";

// // Lazy load Leaflet map only in the browser
// const LeafletMap = React.lazy(() => import("./LeafletMap"));

// export default function CrossPlatformMap(props: MapProps) {
//   return (
//     <Suspense fallback={<div>Loading map...</div>}>
//       <LeafletMap {...props} />
//     </Suspense>
//   );
// }
