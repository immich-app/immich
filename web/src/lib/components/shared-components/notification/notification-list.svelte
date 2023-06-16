<script lang="ts">
	import { fade } from 'svelte/transition';
	import { notificationController } from './notification';

	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import NotificationCard from './notification-card.svelte';

	const { notificationList } = notificationController;
</script>

{#if $notificationList.length > 0}
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
