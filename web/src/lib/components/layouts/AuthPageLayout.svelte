<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, Logo, VStack } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section class="min-w-screen flex min-h-screen items-center justify-center">
  <Card color="secondary" class="w-full max-w-md">
    <CardHeader>
      <VStack>
        <Logo variant="icon" size="giant" />
        <Heading size="large" color="primary">{title}</Heading>
      </VStack>
    </CardHeader>
    <CardBody>
      {@render children?.()}
    </CardBody>
  </Card>
</section>
