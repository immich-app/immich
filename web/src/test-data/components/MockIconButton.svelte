<script lang="ts">
  type Props = {
    disabled?: boolean;
    onclick?: () => void | Promise<void>;
    title?: string;
    [key: string]: unknown;
  };

  let { disabled = false, onclick, title, ...rest }: Props = $props();
</script>

<button type="button" {disabled} {title} {onclick} {...rest}></button>
