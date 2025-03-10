<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, immichLogo, Logo, VStack } from '@immich/ui';
  import type { Snippet } from 'svelte';
  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section class="min-w-screen flex min-h-dvh items-center justify-center relative">
  <div class="absolute -z-10 w-full h-full flex place-items-center place-content-center">
    <img
      src={immichLogo}
      class="max-w-screen-md mx-auto h-full mb-2 antialiased -z-10 overflow-hidden"
      alt="Immich logo"
    />
    <div
      class="w-full h-[99%] absolute left-0 top-0 backdrop-blur-[200px] bg-transparent dark:bg-immich-dark-bg/20"
    ></div>
  </div>

  <Card color="secondary" class="w-full max-w-lg border m-2">
    <CardHeader class="mt-6">
      <VStack>
        <Logo variant="icon" size="giant" />
        <Heading size="large" class="font-semibold" color="primary" tag="h1">{title}</Heading>
      </VStack>
    </CardHeader>

    <CardBody class="p-8">
      {@render children?.()}
    </CardBody>
  </Card>
</section>
