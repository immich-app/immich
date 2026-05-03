<script lang="ts">
  interface Props {
    person: { id: string };
    mergePeople?: (person: { id: string }, selectedPeople: Array<{ id: string; [key: string]: unknown }>) => void;
    onSwapPerson?: (person: { id: string; [key: string]: unknown }) => void;
    searchPeople?: (name: string) => void;
  }

  let { person, mergePeople = () => {}, onSwapPerson = () => {}, searchPeople = () => {} }: Props = $props();

  const personalCandidate = {
    id: 'person-candidate',
    name: 'Personal Candidate',
    primaryProfile: { type: 'user-person', id: 'person-candidate' },
  };

  const spaceCandidate = {
    id: 'space-person-candidate',
    name: 'Space Candidate',
    primaryProfile: { type: 'space-person', id: 'space-person-candidate', spaceId: 'space-2' },
  };
</script>

<div data-testid="people-merge-selector" data-person-id={person.id}>
  choose_matching_people_to_merge
  <button type="button" data-testid="merge-personal-candidate" onclick={() => mergePeople(person, [personalCandidate])}>
    merge personal candidate
  </button>
  <button type="button" data-testid="merge-space-candidate" onclick={() => mergePeople(person, [spaceCandidate])}>
    merge space candidate
  </button>
  <button
    type="button"
    data-testid="merge-swapped-space-candidate"
    onclick={() => mergePeople(spaceCandidate, [person])}
  >
    merge swapped space candidate
  </button>
  <button type="button" data-testid="swap-space-candidate" onclick={() => onSwapPerson(spaceCandidate)}>
    swap space candidate
  </button>
  <button type="button" data-testid="search-merge-candidates" onclick={() => searchPeople('Alice')}>search</button>
</div>
