<script lang="ts">
  import { registerSpaceContext, type RegisterSpaceContextOptions } from '$lib/managers/command-context-manager.svelte';
  import type { SharedSpaceMemberResponseDto, SharedSpaceResponseDto } from '@immich/sdk';

  let {
    spaceThunk,
    membersThunk,
    options = {},
  }: {
    spaceThunk: () => SharedSpaceResponseDto | undefined;
    membersThunk: () => SharedSpaceMemberResponseDto[] | undefined;
    options?: RegisterSpaceContextOptions;
  } = $props();

  registerSpaceContext(spaceThunk, membersThunk, options);
</script>
