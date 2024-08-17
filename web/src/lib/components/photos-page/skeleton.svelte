<script lang="ts">
  export let title: string | null = null;
  export let height: string | null = null;
</script>

<style>
  #skeleton {
    background-image: url('/light_skeleton.png');
    background-repeat: repeat;
    background-size: 235px, 235px;
  }
  :global(.dark) #skeleton {
    background-image: url('/dark_skeleton.png');
  }
</style>
