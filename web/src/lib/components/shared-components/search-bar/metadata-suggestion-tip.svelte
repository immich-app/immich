<script lang="ts">
  interface Props {
    value: string;
    description: string;
    example: string;
  }

  let { value, description, example }: Props = $props();
</script>

<div class="flex justify-between bg-gray-100 p-2 w-full rounded-lg">
  <div class="">
    <p class="font-semibold text-[10px] text-primary">{description.toUpperCase()}</p>
    <code class="italic text-[12px]">{example}</code>
  </div>
  <code class="bg-immich-primary/15 px-2 rounded-lg flex place-items-center place-content-center font-bold"
    >{value}</code
  >
</div>
