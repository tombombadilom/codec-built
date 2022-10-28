<script>
  import { getContext, onDestroy } from 'svelte';
  import maplibre from 'maplibre-gl';

  export let content;

  const tooltip = new maplibre.Popup({
		closeButton: false,
		closeOnClick: false
	});

  const { getMap } = getContext('map');
  console.log('getMap', getMap);
	const map = getMap();
  const hoverObj = getContext('hover');
  
  console.log('hoverObj', hoverObj);

  function updateTooltip(obj, content) {
    console.log("toto");
    if (obj.id) {
      tooltip
			.setLngLat(obj.event.lngLat)
      .setHTML(content ? content : obj.code)
      .addTo(map);
    } else {
      tooltip.remove();
    }
  }

  $: updateTooltip($hoverObj, content);

  onDestroy(() => tooltip.remove());
</script>

<style>
  :global(.maplibregl-popup-content) {
		padding: 5px 10px !important;
	}
</style>