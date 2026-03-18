<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getKeyboardActions } from '$lib/services/keyboard.service';
  import { Container } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    children?: Snippet;
    data: PageData;
  };

  let { children, data }: Props = $props();

  const { KeyboardShortcuts } = $derived(getKeyboardActions($t));
</script>

<UserPageLayout title={data.meta.title} actions={[KeyboardShortcuts]}>
  <Container size="medium" center>
    {@render children?.()}
  </Container>
</UserPageLayout>
