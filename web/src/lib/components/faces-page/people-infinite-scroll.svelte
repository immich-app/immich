<script lang="ts">
  import type { PersonResponseDto } from '@immich/sdk';

  export let people: PersonResponseDto[];
  export let hasNextPage: boolean | undefined = undefined;
  export let loadNextPage: () => void;

  let lastPersonContainer: HTMLElement | undefined;

  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries.find((entry) => entry.target === lastPersonContainer);
    if (entry?.isIntersecting) {
      loadNextPage();
    }
  });

  $: if (lastPersonContainer) {
    intersectionObserver.disconnect();
    intersectionObserver.observe(lastPersonContainer);
  }
</script>

<div class="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 gap-1">
  {#each people as person, index (person.id)}
    {#if hasNextPage && index === people.length - 1}
      <div bind:this={lastPersonContainer}>
        <slot {person} {index} />
      </div>
    {:else}
      <slot {person} {index} />
    {/if}
  {/each}
</div>
