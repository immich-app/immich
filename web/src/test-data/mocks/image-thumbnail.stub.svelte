<script lang="ts">
  interface Props {
    url?: string;
    altText?: string;
  }

  const { url = '', altText = '' }: Props = $props();
</script>

<img data-testid="image-thumbnail" src={url} alt={altText} />
