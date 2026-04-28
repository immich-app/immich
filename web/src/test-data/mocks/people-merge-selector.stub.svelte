<script lang="ts">
  interface Props {
    person: { id: string };
  }

  let { person }: Props = $props();
</script>

<div data-testid="people-merge-selector" data-person-id={person.id}>choose_matching_people_to_merge</div>
