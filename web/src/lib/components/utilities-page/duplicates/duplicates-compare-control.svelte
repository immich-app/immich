<script lang="ts">
  import type { DuplicateResponseDto } from '@immich/sdk';

  export let duplicate: DuplicateResponseDto;
</script>

<div class="border border-gray-200">
  {duplicate.duplicateId}
</div>
