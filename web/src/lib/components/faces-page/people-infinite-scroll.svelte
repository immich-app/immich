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

<div class="w-full flex flex-wrap justify-evenly gap-2">
  {#each people as person, index (person.id)}
    {#if hasNextPage && index === people.length - 1}
      <div class="flex-none max-md:w-[100px] w-[122px]" bind:this={lastPersonContainer}>
        {@render children?.({ person, index })}
      </div>
    {:else}
      <div class="flex-none max-md:w-[100px] w-[122px]">
        {@render children?.({ person, index })}
      </div>
    {/if}
  {/each}
</div>
