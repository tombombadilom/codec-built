<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
	import Map from '../maplibre/Map.svelte';
  import Loading from '../maplibre/Loading.svelte';
	import MapSource from '../maplibre/MapSource.svelte';
	import MapLayer from '../maplibre/MapLayer.svelte';
	import MapTooltip from '../maplibre/MapTooltip.svelte';
  // import Marker from '../maplibre/Marker.svelte';

  import { getDatasFromStore, getMapSource } from '../maplibre/utils';
  import { throttle } from "underscore";
  import { watchResize } from "svelte-watch-resize";
  import {
    platform_config_store,
    media_store_filtered,
    ui_store,
  } from "../../stores/store";

  	// Bindings
	let mapId;

  // Data
  let data;
  const source = getMapSource("main");
  let geojson;
  $: geojson = getDatasFromStore(Object.values($media_store_filtered),[parseFloat($platform_config_store["Map start longitude"]),parseFloat($platform_config_store["Map start latitude"])] );

  // State
	let zoom;
	let center = {};
	let hovered, selected;

	let showSources = true;
	let showLayers = true;
	let visLayers = true;
  let mapComponent;

  let handleResize = throttle(() => {
    if (mapComponent) mapComponent.resize();
  }, 500);

  function onMarkerClick(event) {
    let UAR = event.id; //automatically lowercased
    if ($ui_store.media_in_view.includes(UAR)) {
      $ui_store.media_in_view = $ui_store.media_in_view.filter(
        (exist_UAR) => exist_UAR !== UAR
      );
    } else {
      $ui_store.media_in_view = [...$ui_store.media_in_view, UAR];
    }
  }
  // function onMarkerOver(event) {
  //   let UAR = event.target.dataset.uar; //automatically lowercased
  //   $ui_store.media_hovered = [...$ui_store.media_hovered, UAR];
  // }
  // function onMarkerOut(event) {
  //   let UAR = event.target.dataset.uar; //automatically lowercased
  //   $ui_store.media_hovered = $ui_store.media_hovered.filter(
  //     (exist_UAR) => exist_UAR !== UAR
  //   );
  // }
  
</script>
(hovered: {hovered ? hovered : ''},
selected: {#if selected} {selected} <button on:click|preventDefault={() => selected = null}>x</button>{/if})
<!-- svelte-ignore missing-declaration -->
<div class="map_container" use:watchResize={handleResize}>
  {#if $platform_config_store["Map start latitude"] !== undefined && geojson && geojson.data }
    <Map
      id="mapId" 
      style="./map-style/style-osm-grey.json" 
      location={{lng: parseFloat($platform_config_store["Map start longitude"]), lat: parseFloat($platform_config_store["Map start latitude"]), zoom: parseFloat($platform_config_store["Map start zoom"])}}
      bind:map={mapId} 
      controls={true}
      maxzoom={20}
      minzoom={8}
      interactive={true}
      customMarker={true}
    >
    <MapSource
      id="pcon"
      type={"geojson"}
      data={geojson.data}
    >
      <MapLayer
        id="points"
        data={geojson}
        type="symbol"
        source="points"
        onClick={onMarkerClick}
        filter={["all", ["==","$type","Point"]]}
        layout= {{
          'icon-size': 2,
          'icon-image': 'custom-marker',
           //'icon-image': 'circle-15',
           //'icon-image': ['get', 'icon'],
           'visibility': 'visible',
          //  'icon-ignore-placement': true,
          'icon-allow-overlap': true,
          //'text-field': ['get', 'label'],
          //'text-offset': [0, 1.25],
          //'text-anchor': 'top'
        }}
        hover={true}
        bind:hovered
        select={true}
        bind:selected
        paint= {{
          "text-color": "#FF9900",
          "text-halo-color": "#333333",
          "text-halo-width": 1,
        }}
        visible={true}
        >

      </MapLayer>
    </MapSource>
    </Map>
  {:else}
    <Loading />
  {/if}

</div>

<style>
  :global(.mapboxgl-marker) {
    cursor: pointer;
  }

  .map_container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
