<script lang="ts">
  export let className = '';
</script>

<slot name="header" />

<main tabindex="-1" id="immich-main-layout" class={className}>
  <slot />
</main>

<style>
  :root {
    /* On touch devices, prevent the page from bouncing when overscrolling */
    overscroll-behavior: none;
  }

  #immich-main-layout {
    height: 100vh;
  }

  @supports (height: 100dvh) {
    /*
     * On mobile browsers, like iOS Safari, prevent the page height to be greater
     * than the viewport height when the browser's navbar is visible
     */
    #immich-main-layout {
      height: 100dvh;
    }
  }
</style>
