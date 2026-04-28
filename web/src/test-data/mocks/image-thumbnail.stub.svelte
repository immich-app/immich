<script lang="ts">
  interface Props {
    altText?: string;
    url?: string;
  }

  let { altText = '', url = '' }: Props = $props();
</script>

<img src={url} alt={altText} />
