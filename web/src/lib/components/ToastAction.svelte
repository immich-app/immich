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

<ToastContainer {color}>
  <ToastContent {color} {title} {description} {onClose} {icon}>
    {#if button}
      <div class="flex justify-end gap-2 px-2 pb-2 me-3 mt-2">
        <Button color={button.color ?? 'secondary'} size="small" onclick={onClick}>{button.text}</Button>
      </div>
    {/if}
  </ToastContent>
</ToastContainer>
