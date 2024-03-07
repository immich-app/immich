<script lang="ts">
  import { notificationController } from './notification';
  import { fade } from 'svelte/transition';

  import NotificationCard from './notification-card.svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  const { notificationList } = notificationController;
</script>

{#if $notificationList.length > 0}
  <section transition:fade={{ duration: 250 }} id="notification-list" class="fixed right-5 top-[80px] z-[99999999]">
    {#each $notificationList as notificationInfo (notificationInfo.id)}
      <div animate:flip={{ duration: 250, easing: quintOut }}>
        <NotificationCard {notificationInfo} />
      </div>
    {/each}
  </section>
{/if}
