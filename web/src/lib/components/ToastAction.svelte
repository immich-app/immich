<script lang="ts">
  import { Button, ToastContainer, ToastContent, type Color, type IconLike } from '@immich/ui';

  type Props = {
    onClose?: () => void;
    color?: Color;
    title: string;
    icon?: IconLike | false;
    description: string;
    button?: {
      text: string;
      color?: Color;
      onClick: () => void;
    };
  };

  const { onClose, title, description, color, icon, button }: Props = $props();

  const onClick = () => {
    button?.onClick();
    onClose?.();
  };
</script>

<ToastContainer {color} class="shadow-sm border border-gray-200 dark:border-gray-900">
  <ToastContent {color} {title} {description} {onClose} {icon}>
    {#if button}
      <div class="flex justify-end gap-2 px-2 pb-2 mr-3 mt-2">
        <Button color={button.color ?? 'secondary'} size="small" onclick={onClick}>{button.text}</Button>
      </div>
    {/if}
  </ToastContent>
</ToastContainer>
