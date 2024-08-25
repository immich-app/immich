<script lang="ts">
  import { notificationController } from './notification';
  import { fade } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import NotificationCard from './notification-card.svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';

  const { notificationList } = notificationController;
</script>

<div role="status" aria-relevant="additions" aria-label={$t('notifications')}>
  {#if $notificationList.length > 0}
    <section transition:fade={{ duration: 250 }} id="notification-list" class="fixed right-5 top-[80px] z-[99999999]">
      {#each $notificationList as notification (notification.id)}
        <div animate:flip={{ duration: 250, easing: quintOut }}>
          <NotificationCard {notification} />
        </div>
      {/each}
    </section>
  {/if}
</div>
