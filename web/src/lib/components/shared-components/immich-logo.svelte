<script lang="ts">
	import immichLogoUrl from '$lib/assets/immich-logo.svg';

	export let draggable = false;
</script>

<img src={immichLogoUrl} alt="Immich Logo" {draggable} {...$$restProps} />
