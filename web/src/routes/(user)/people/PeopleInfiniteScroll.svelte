<script lang="ts">
  import type { PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    hasNextPage?: boolean | undefined;
    loadNextPage: () => void;
    children?: import('svelte').Snippet<[{ person: PersonResponseDto; index: number }]>;
  }

  let { people, hasNextPage = undefined, loadNextPage, children }: Props = $props();

  let lastPersonContainer: HTMLElement | undefined = $state();

  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries.find((entry) => entry.target === lastPersonContainer);
    if (entry?.isIntersecting) {
      loadNextPage();
    }
  });

  $effect(() => {
    if (lastPersonContainer) {
      intersectionObserver.disconnect();
      intersectionObserver.observe(lastPersonContainer);
    }
  });
</script>

<div class="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-10 gap-1">
  {#each people as person, index (person.id)}
    {#if hasNextPage && index === people.length - 1}
      <div bind:this={lastPersonContainer}>
        {@render children?.({ person, index })}
      </div>
    {:else}
      {@render children?.({ person, index })}
    {/if}
  {/each}
</div>
