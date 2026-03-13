<script lang="ts">
  interface Props {
    size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
    class?: string;
  }

  const sizeClasses: Record<string, string> = {
    tiny: 'h-3',
    small: 'h-4',
    medium: 'h-5',
    large: 'h-6',
    giant: 'h-12',
  };

  let { size = 'medium', class: className }: Props = $props();
</script>

<div>
  <img
    role="status"
    class={[sizeClasses[size], className].filter(Boolean).join(' ')}
    src="/gallery-loader.svg"
    alt="Loading"
    data-testid="loading-spinner"
  />
</div>
