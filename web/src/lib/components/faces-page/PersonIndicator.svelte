<script lang="ts">
  import type { PersonResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiAccountMultiple, mdiHeart } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
  };

  let { person }: Props = $props();
</script>

{#if person.isFavorite || person.otherPeople.length > 0}
  <div
    class="absolute inset-e-[14.6%] bottom-[14.6%] flex translate-1/2 items-center gap-[0.25em] rounded-full border-primary bg-light-200 p-[0.25em] text-[max(10cqw,12px)] text-dark rtl:-translate-x-1/2 dark:bg-immich-dark-gray"
  >
    {#if person.isFavorite}
      <Icon icon={mdiHeart} size="1em" title={$t('favorite')} />
    {/if}

    {#if person.otherPeople.length > 0}
      <Icon icon={mdiAccountMultiple} size="1em" title={$t('shared_with_me')} />
    {/if}
  </div>
{/if}
