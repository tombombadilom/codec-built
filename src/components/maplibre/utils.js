// return geojson feature layer
// store =>  list of media available
// center => center of the map [long,lat]
// type => type of the point symbol or circle
export const getDatasFromStore = (store, center, type) => {
  if (store && store.length > 0) {
    const points = store.filter((m, i) => (m.long && m.lat));
    const geojson = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        crs: {
          type: "name",
          properties: {
            name: "EPSG:3857"
          }
        },
        cluster: true,
        clusterRadius: 20, // cluster two trailheads if less than 20 pixels apart
        clusterMaxZoom: 14, //
        features: []
      }
    };
    geojson.data.features = points.map((p, i) => (
      {
        type: "Feature",
        id: i,
        properties: {
          // "radius": 5, // if circle
          filetype: p["File Type"],
          filename: p["File Name"],
          contentAnalysis: [p.contentAnalysis],
          label: p.label,
          id: p.id
        },
        geometry: {
          type: "Point",
          coordinates: [p.long, p.lat]
        }
      }
    ));
    return geojson;
  }
};
// export const getMapSource = (source) => {
//   const geojson = {
//     type: "geojson",
//     data: {
//       type: "FeatureCollection",
//       features: [
//         { id: 1, type: "Feature" }
//       ]
//     }
//   };
// };
// export async function getTopo (url, layer) {
//   const response = await fetch(url);
//   const json = await response.json();
//   const geojson = await feature(json, layer);
//   return geojson;
// }

export function getColor (value, breaks, colors) {
  let color;
  let found = false;
  let i = 1;
  while (found === false) {
    if (value <= breaks[i]) {
      color = colors[i - 1];
      found = true;
    } else {
      i++;
    }
  }
  return color || "lightgrey";
}

export function sleep (ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
