<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, Logo, VStack } from '@immich/ui';
  import type { Snippet } from 'svelte';
  interface Props {
    title?: string;
    children?: Snippet;
    withHeader?: boolean;
  }

  let { title, children, withHeader = true }: Props = $props();
</script>

<section class="min-w-dvw flex min-h-dvh items-center justify-center relative">
  <div class="absolute -z-10 w-full h-full flex place-items-center place-content-center">
    <img
      src="https://pixelunion.eu/images/logo-icon.png"
      class="max-w-(--breakpoint-md) mx-auto h-full mb-2 antialiased overflow-hidden"
      alt="Immich logo"
    />
    <div
      class="w-full h-[99%] absolute start-0 top-0 backdrop-blur-[200px] bg-transparent dark:bg-immich-dark-bg/20"
    ></div>
  </div>

  <Card color="secondary" class="w-full max-w-lg border m-2">
    {#if withHeader}
      <CardHeader class="mt-6">
        <VStack>
          <Logo variant="icon" size="giant" />
          <Heading size="large" class="font-semibold" color="primary" tag="h1">{title}</Heading>
        </VStack>
      </CardHeader>
    {/if}

    <CardBody class="p-8">
      <img src="https://pixelunion.eu/images/logo.png" alt="Immich logo" />
      {@render children?.()}
    </CardBody>
  </Card>
</section>
