<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, Logo, VStack } from '@immich/ui';
  import type { Snippet } from 'svelte';
  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section class="min-w-dvw flex min-h-dvh items-center justify-center relative">
  <div class="absolute -z-10 w-full h-full flex place-items-center place-content-center">
    <img
      src="https://pixelunion.eu/images/logo-icon.png"
      class="max-w-screen-md mx-auto h-full mb-2 antialiased -z-10 overflow-hidden"
      alt="Immich logo"
    />
    <div
      class="w-full h-[99%] absolute left-0 top-0 backdrop-blur-[200px] bg-transparent dark:bg-immich-dark-bg/20"
    ></div>
  </div>

  <Card color="secondary" class="w-full max-w-lg border m-2">
    <CardBody class="p-8">
      <img src="https://pixelunion.eu/images/logo.png" alt="Immich logo" />
      {@render children?.()}
    </CardBody>
  </Card>
</section>
