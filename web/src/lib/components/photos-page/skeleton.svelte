<script lang="ts">
  interface Props {
    height: number;
  }

  let { height = 0 }: Props = $props();
</script>

<div data-skeleton="true" class="overflow-clip" style={`height: ${height + 49}px`}>
  <div id="skeleton" style={`height: ${height + 49}px`}></div>
</div>

<style>
  #skeleton {
    background-image: url('/light_skeleton.png');
    background-repeat: repeat;
    background-size: 235px, 235px;
  }
  :global(.dark) #skeleton {
    background-image: url('/dark_skeleton.png');
  }
  @keyframes delayedVisibility {
    to {
      visibility: visible;
    }
  }
  #skeleton {
    visibility: hidden;
    animation: 0s linear 0.1s forwards delayedVisibility;
  }
</style>
