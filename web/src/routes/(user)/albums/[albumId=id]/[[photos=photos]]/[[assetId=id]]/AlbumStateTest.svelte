<script lang="ts">
  interface Props {
    dataAlbum: { id: string; order: string };
  }

  let { dataAlbum = $bindable() }: Props = $props();

  let album = $state(dataAlbum);
  $effect(() => {
    const newAlbum = dataAlbum;
    if (newAlbum.id !== album.id) {
      album = newAlbum;
    }
  });

  export function getAlbum() {
    return album;
  }
</script>
