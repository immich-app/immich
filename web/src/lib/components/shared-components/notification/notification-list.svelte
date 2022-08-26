<script lang="ts">
	import { notificationList } from './notification';
	import { fade } from 'svelte/transition';

	import NotificationCard from './notification-card.svelte';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
</script>

{#if $notificationList?.length > 0}
	<section
		transition:fade={{ duration: 250 }}
		id="notification-list"
		class="absolute right-5 top-[80px] z-[99999999]"
	>
		{#each $notificationList as notificationInfo (notificationInfo.id)}
			<div animate:flip={{ duration: 250, easing: quintOut }}>
				<NotificationCard {notificationInfo} />
			</div>
		{/each}
	</section>
{/if}
