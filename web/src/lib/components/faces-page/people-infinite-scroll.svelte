<script lang="ts">
  import { intersectionObserver } from '$lib/actions/intersection-observer';
  import type { PersonResponseDto } from '@immich/sdk';

  interface Props {
    people: PersonResponseDto[];
    hasNextPage?: boolean | undefined;
    loadNextPage: () => void;
    children?: import('svelte').Snippet<[{ person: PersonResponseDto; index: number }]>;
  }

  let { people, hasNextPage = undefined, loadNextPage, children }: Props = $props();
</script>

<section class="w-full flex flex-wrap gap-2">
  {#each people as person, index (person.id)}
    {#if hasNextPage && index === people.length - 1}
      <div
        class="flex-none max-md:w-[100px] w-[122px]"
        use:intersectionObserver={{
          onIntersect: loadNextPage,
        }}
      >
        {@render children?.({ person, index })}
      </div>
    {:else}
      <div class="flex-none max-md:w-[100px] w-[122px]">
        {@render children?.({ person, index })}
      </div>
    {/if}
  {/each}
</section>

<style>
  section::after {
    content: '';
    flex: auto;
    flex-basis: 122px;
    flex-grow: 0;
  }
</style>
