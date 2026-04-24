<script lang="ts">
  interface Props {
    isLoading?: boolean;
    searchQuery?: string;
    [key: string]: unknown;
  }

  let { isLoading = $bindable(false), searchQuery = '', ...rest }: Props = $props();
</script>

<div
  {...rest}
  data-testid="smart-search-results"
  data-loading={String(isLoading)}
  data-search-query={searchQuery}
></div>
