<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetResponseDto } from '@immich/sdk';
  import { Field, FormModal, Select, Text, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type StyleTransformStyle = 'ghibli';

  type Props = {
    asset: AssetResponseDto;
    onClose: (submitted?: boolean) => void;
  };

  const { asset, onClose }: Props = $props();

  let selectedStyle = $state<StyleTransformStyle>('ghibli');
  let isSubmitting = $state(false);

  const styleOptions: { value: StyleTransformStyle; label: string }[] = [{ value: 'ghibli', label: '吉卜力动画' }];

  const onSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch('/api/memorydock/style-transforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.id, style: selectedStyle }),
      });

      if (!response.ok) {
        throw new Error(`Style transform request failed: ${response.status}`);
      }

      toastManager.success('AI风格图已生成并已添加到照片');
      onClose(true);
    } catch (error) {
      handleError(error, 'AI风格转变提交失败');
    } finally {
      isSubmitting = false;
    }
  };
</script>

<FormModal
  title="AI风格转变"
  size="small"
  {onClose}
  {onSubmit}
  disabled={isSubmitting}
  submitText={isSubmitting ? $t('submit') : $t('confirm')}
>
  <div class="flex flex-col gap-4">
    <Text color="muted">选择要应用到当前图片的 AI 风格。</Text>

    <Field label="风格">
      <Select bind:value={selectedStyle} options={styleOptions} />
    </Field>
  </div>
</FormModal>
