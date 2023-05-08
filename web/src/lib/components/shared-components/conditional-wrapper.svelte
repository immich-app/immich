<script lang="ts">
	export let condition: boolean;
</script>

{#if condition}
	<div class={$$restProps.class || ''}>
		<slot />
	</div>
{:else}
	<slot />
{/if}
