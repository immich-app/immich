<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, Logo, VStack } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section class="min-w-screen flex min-h-dvh items-center justify-center relative">
  <div class="absolute -z-10 w-[99%] h-[99%] flex place-items-center place-content-center">
    <img src="/immich-logo-no-bg.svg" class="w-[750px] mb-2 antialiased -z-10" alt="Immich logo" />
    <div class="w-full h-[99%] absolute left-0 top-0 backdrop-blur-3xl bg-immich-bg/80 dark:bg-immich-dark-bg/20"></div>
  </div>

  <Card color="secondary" class="w-full max-w-lg border m-2">
    <CardHeader class="mt-6">
      <VStack>
        <Logo variant="icon" size="giant" />
        <Heading size="large" class="font-semibold" color="primary">{title}</Heading>
      </VStack>
    </CardHeader>

    <div class="pb-4">
      <CardBody>
        {@render children?.()}
      </CardBody>
    </div>
  </Card>
</section>
