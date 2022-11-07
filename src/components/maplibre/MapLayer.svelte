<script>
  import { getContext, setContext, createEventDispatcher, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import maplibre from "maplibre-gl";

  const dispatch = createEventDispatcher();

  export let id;
  export let type;
  export let filter = null;
  export let layout = {};
  export let paint = {};

  export let onClick = null;

  export let idKey = null;
  export let select = false;
  export let clickIgnore = false;
  export let clickCenter = false;
  export let selected = null;
  export let hover = false;
  export let hovered = null;
  export let highlight = false;
  export let highlightKey = "highlighted";
  export let highlighted = [];
  export let order = null;
  export let maxzoom = null;
  export let minzoom = null;
  export let sourceLayer = null;
  export let visible = true;

  const { source, layer, promoteId } = getContext("source");
  const { getMap } = getContext("map");
  const map = getMap();

  setContext("layer", {
    layer: id
  });

  const hoverObj = writable({
    id: null,
    feature: null,
    event: null
  });
  setContext("hover", hoverObj);

  idKey = idKey || promoteId;
  sourceLayer = sourceLayer || layer;

  let selectedPrev = null;
  let hoveredPrev = null;
  let highlightedPrev = [];

  layout.visibility = visible ? "visible" : "none";

  const options = {
    id,
    type,
    source,
    paint,
    layout
  };

  if (filter) {
    options.filter = filter;
  }

  if (sourceLayer) {
    options["source-layer"] = sourceLayer;
  }
  if (maxzoom) {
    options.maxzoom = maxzoom;
  }
  if (minzoom) {
    options.minzoom = minzoom;
  }

  if (map.getLayer(id)) {
    map.removeLayer(id);
  }

  map.addLayer(options, order);

  // Function to update layer filter
  function setFilter (filter) {
    if (map.getLayer(id)) map.setFilter(id, filter);
  }
  $: setFilter(filter);

  // Function to update paint properties
  function setPaint (paint) {
    if (map.getLayer(id)) {
      for (const key in paint) {
        map.setPaintProperty(id, key, paint[key]);
      }
    };
  }
  $: setPaint(paint);

  // Function to toggle layer visibility based on "visible" prop
  function toggleVisibility (visible) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
  }
  $: toggleVisibility(visible);

  // Updates the "highlighted" feature state as geo codes are added to/removed from the highlighted array
  $: if (highlight && highlighted !== highlightedPrev) {
    if (highlightedPrev[0]) {
      for (const id of highlightedPrev) {
        const state = {};
        state[highlightKey] = false;
        map.setFeatureState(
          { source, sourceLayer, id },
          state
        );
      }
    }
    highlightedPrev = highlighted;
    if (highlighted[0]) {
      for (const id of highlighted) {
        const state = {};
        state[highlightKey] = true;
        map.setFeatureState(
          { source, sourceLayer, id },
          state
        );
      }
    }
  }
  // Create a popup, but don't add it to the map yet.
  const popup = new maplibre.Popup({
    closeButton: false,
    closeOnClick: false
  });
  // Adds a click event to change the selected geo code (if select = true for map layer)
  if (select) {
    map.on("click", id, (e) => {
      if (e.features.length > 0 && !clickIgnore) {
        const feature = e.features[0];
        selected = feature.id;
        dispatch("select", {
          id: selected,
          feature,
          event: e
        });

        if (selectedPrev) {
          map.setFeatureState(
            { source, sourceLayer, id: selectedPrev },
            { selected: false }
          );
        }

        map.setFeatureState(
          { source, sourceLayer, id: selected },
          { selected: true }
        );

        if (clickCenter) {
          const center = [e.features[0].toJSON().geometry[0], e.features[0].toJSON().geometry[1]];
          map.flyTo({
            center: center.geometry.coordinates
          });
        }
        selectedPrev = selected;
        map.getCanvas().style.cursor = "pointer";
        return onClick(feature.properties);
      }
    });
  }

  // Updates the selected geo code if it is changed elsewhere in the app (outside of this component)
  $: if (select && selected !== selectedPrev) {
    if (selectedPrev) {
      map.setFeatureState(
        { source, sourceLayer, id: selectedPrev },
        { selected: false }
      );
    }
    if (selected) {
      map.setFeatureState(
        { source, sourceLayer, id: selected },
        { selected: true }
      );
    }
    selectedPrev = selected;
  }

  // Adds an event to update the hovered geo code when the mouse is moved over the map
  if (hover) {
    map.on("mousemove", id, (e) => {
      if (e.features.length > 0) {
        if (hovered) {
          map.setFeatureState(
            { source, sourceLayer, id: hovered, sourceProperties: { name: "toto" } },
            { hovered: false }
          );
        }
        const feature = e.features[0];
        // console.log('feature', feature);
        hovered = hoveredPrev = feature.id;
        hoverObj.set({
          id: hovered,
          feature,
          event: e
        });

        dispatch("hover", $hoverObj);
        // console.log('hover', $hoverObj);
        map.setFeatureState(
          {
            source,
            sourceLayer,
            id: hovered
          },
          { hovered: true }
        );
        map.setLayoutProperty(id, "icon-size", 3);
        // map.setLayoutProperty(id, 'icon-image', 'map-marker6');
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = "pointer";
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        const markerPopup = "<div bind:this={layer} {id} class=\"popup\"><h3 class=\"items\">" + properties.label + "</h3><div class=\"items\">UAR: " + properties.id + "</div><div class=\"items\">File type: " + properties.filetype + "</div><div class=\"items\">File name: " + properties.filename + "</div><div class=\"items\">content Analisys: " + JSON.stringify(properties.contentAnalisys) + "</div></div>";
        popup.setLngLat(coordinates)
          .setHTML(markerPopup)
          .addTo(map);
      }
    });

    map.on("mouseleave", id, (e) => {
      if (hovered) {
        map.setFeatureState(
          { source, sourceLayer, id: hovered },
          { hovered: false }
        );
      }
      hovered = hoveredPrev = null;

      hoverObj.set({
        id: null,
        feature: null,
        event: e
      });

      dispatch("hover", $hoverObj);
      // Reset cursor and remove popup
      map.getCanvas().style.cursor = "";
      popup.remove();
      map.setLayoutProperty(id, "icon-size", 1.8);
    // map.setLayoutProperty(id, 'icon-image', 'map-marker4');
    });
  }

  // Updates the hovered geo code if it is changed elsewhere in the app (outside of this component)
  $: if (hover && hovered !== hoveredPrev) {
    if (hoveredPrev) {
      map.setFeatureState(
        { source, sourceLayer, id: hoveredPrev },
        { hovered: false }
      );
    }
    if (hovered) {
      map.setFeatureState(
        { source, sourceLayer, id: hovered },
        { hovered: true }
      );
    }
    hoveredPrev = hovered;
  }

  onDestroy(async () => {
    if (map && map.getLayer(id)) map.removeLayer(id);
  });
</script>

<style>
.popup{
display: flex;
min-width: 5rem;
min-height: 2rem;
flex-direction: row;
align-items: left;
justify-content: top;
}
.items{
width: 100%;
display: flex;
}
</style>

<slot {hovered}></slot>
