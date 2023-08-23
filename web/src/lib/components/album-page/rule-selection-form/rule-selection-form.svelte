<script lang="ts">
  import BaseModal from '$lib/components/shared-components/base-modal.svelte';
  import { PersonResponseDto, RuleKey, RuleResponseDto, api } from '@api';
  import { createEventDispatcher } from 'svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import { fly } from 'svelte/transition';
  import Button from '../../elements/buttons/button.svelte';
  import Portal from '../../shared-components/portal/portal.svelte';
  import FaceSelection from './face-selection.svelte';

  export let rules: RuleResponseDto[] = [];

  let peopleSelection = false;
  let locationSelection = false;

  $: peopleRules = rules.filter((rule) => rule.key === RuleKey.Person);

  const dispatch = createEventDispatcher<{
    submit: RuleResponseDto[];
    close: void;
  }>();

  const handleSelectPeople = async (people: PersonResponseDto[]) => {
    rules = [...rules, ...people.map((person) => ({ key: RuleKey.Person, value: person.id } as RuleResponseDto))];
    peopleSelection = false;
  };

  const handleRemoveRule = async (rule: RuleResponseDto) => {
    rules = rules.filter((_rule) => rule !== _rule);
  };
</script>

<BaseModal
  ignoreClickOutside
  on:close={() => {
    dispatch('close');
  }}
>
  <svelte:fragment slot="title">
    <div class="flex place-items-center gap-2">
      <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Automatically add photos</p>
    </div>
  </svelte:fragment>

  <section class="mb-5 px-5">
    <!--  People Selection -->
    <div id="people-selection">
      <p class="text-sm">PEOPLE</p>

      <div class="mt-4 flex flex-wrap gap-2">
        {#each peopleRules as rule}
          <button on:click={() => handleRemoveRule(rule)}>
            <img src={api.getPeopleThumbnailUrl(rule.value)} alt={rule.value} class="h-20 w-20 rounded-lg" />
          </button>
        {/each}

        <button
          class="immich-text-primary border-1 flex h-20 w-20 place-content-center place-items-center rounded-lg border border-gray-300 hover:bg-gray-500/20 dark:border-gray-500"
          on:click={() => (peopleSelection = true)}
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Location Selection -->
    <div id="location-selection" class="mt-5">
      <p class="text-sm">LOCATION</p>
      <div class="mt-4">
        <button
          class="immich-text-primary border-1 flex w-full place-content-center place-items-center rounded-3xl border border-gray-300 py-2 hover:bg-gray-500/20 dark:border-gray-500"
          on:click={() => (locationSelection = true)}
        >
          <Plus size="24" />
        </button>
      </div>
    </div>

    <!-- Date Selection -->
    <div id="date-selection" class="mt-5">
      <p class="text-sm">START DATE</p>
      <div class="mt-2">
        <div class="text-xs">
          <p>Only include photos after the set date.</p>
          <p>Include all by default</p>
        </div>

        <div class="mt-4">
          <Button size="sm">Select</Button>
        </div>
      </div>
    </div>
  </section>
  <!-- Buttons rows -->
  <svelte:fragment slot="sticky-bottom">
    <div class="flex justify-end gap-2">
      <Button size="sm" color="secondary" on:click={() => dispatch('close')}>Cancel</Button>
      <Button size="sm" color="primary" on:click={() => dispatch('submit', rules)}>Confirm</Button>
    </div>
  </svelte:fragment>
</BaseModal>

<Portal target="body">
  {#if peopleSelection}
    <section
      transition:fly={{ y: 500 }}
      class="absolute left-0 top-0 z-[10000] h-full min-h-max w-full overflow-y-auto bg-gray-200 dark:bg-immich-dark-bg"
    >
      <FaceSelection
        on:close={() => (peopleSelection = false)}
        on:confirm={({ detail: people }) => handleSelectPeople(people)}
        selectedIds={peopleRules.map(({ value }) => value)}
      />
    </section>
  {/if}
</Portal>
