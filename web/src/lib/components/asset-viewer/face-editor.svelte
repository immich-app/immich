<script lang="ts">
  import paper from 'paper';
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    if (!canvas) {
      return;
    }

    paper.setup(canvas);

    var path = new paper.Path();
    // Give the stroke a color
    path.strokeColor = 'black';
    var start = new paper.Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note that the plus operator on Point objects does not work
    // in JavaScript. Instead, we need to call the add() function:
    path.lineTo(start.add([200, -50]));
    // Draw the view now:
    paper.view.update();
  });
</script>

<div class="absolute left-0 top-0 border-2 boder-green-300 bg-yellow-200/50 z-50 w-full h-full">
  <canvas bind:this={canvas} id="face-editor" class="w-full h-full"></canvas>
</div>
