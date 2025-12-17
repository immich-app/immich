<script lang="ts">
  import SystemSettingsCard from '$lib/components/SystemSettingsCard.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import {
    Button,
    Field,
    HelperText,
    IconButton,
    Input,
    Label,
    Link,
    NumberInput,
    Stack,
    Switch,
    Text,
  } from '@immich/ui';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['machineLearning']} size="large">
  {#snippet child({ disabled, config, configToEdit })}
    <Field
      label={$t('admin.machine_learning_enabled')}
      description={$t('admin.machine_learning_enabled_description')}
      {disabled}
    >
      <Switch bind:checked={configToEdit.machineLearning.enabled} />
    </Field>

    <Label label={$t('url')} />
    <Text size="small" color="muted">{$t('admin.machine_learning_url_description')}</Text>

    <Stack>
      {#each configToEdit.machineLearning.urls as _, i (i)}
        <Input
          bind:value={configToEdit.machineLearning.urls[i]}
          disabled={disabled || !configToEdit.machineLearning.enabled}
        >
          {#snippet trailingIcon()}
            {#if configToEdit.machineLearning.urls.length > 1}
              <IconButton
                size="small"
                aria-label={$t('remove')}
                onclick={() => configToEdit.machineLearning.urls.splice(i, 1)}
                icon={mdiTrashCanOutline}
                color="danger"
              />
            {/if}
          {/snippet}
        </Input>
      {/each}
    </Stack>

    <div class="flex justify-end">
      <Button
        class="mb-2"
        size="small"
        shape="round"
        leadingIcon={mdiPlus}
        onclick={() => configToEdit.machineLearning.urls.push('')}
        disabled={disabled || !configToEdit.machineLearning.enabled}>{$t('add_url')}</Button
      >
    </div>

    <SystemSettingsCard
      title={$t('admin.machine_learning_availability_checks')}
      subtitle={$t('admin.machine_learning_availability_checks_description')}
    >
      <Field
        label={$t('admin.machine_learning_availability_checks_enabled')}
        disabled={disabled || !configToEdit.machineLearning.enabled}
      >
        <Switch bind:checked={configToEdit.machineLearning.availabilityChecks.enabled} />
      </Field>

      <Field
        label={$t('admin.machine_learning_availability_checks_interval')}
        description={$t('admin.machine_learning_availability_checks_interval_description')}
        disabled={disabled ||
          !configToEdit.machineLearning.enabled ||
          !configToEdit.machineLearning.availabilityChecks.enabled}
      >
        <NumberInput bind:value={configToEdit.machineLearning.availabilityChecks.interval} />
      </Field>

      <Field
        label={$t('admin.machine_learning_availability_checks_timeout')}
        description={$t('admin.machine_learning_availability_checks_timeout_description')}
        disabled={disabled ||
          !configToEdit.machineLearning.enabled ||
          !configToEdit.machineLearning.availabilityChecks.enabled}
      >
        <NumberInput bind:value={configToEdit.machineLearning.availabilityChecks.timeout} />
      </Field>
    </SystemSettingsCard>

    <SystemSettingsCard
      title={$t('admin.machine_learning_smart_search')}
      subtitle={$t('admin.machine_learning_smart_search_description')}
    >
      <Field
        label={$t('admin.machine_learning_smart_search_enabled')}
        description={$t('admin.machine_learning_smart_search_enabled_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled}
      >
        <Switch bind:checked={configToEdit.machineLearning.clip.enabled} />
      </Field>

      <Field
        label={$t('admin.machine_learning_clip_model')}
        required={true}
        disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
      >
        <Input bind:value={configToEdit.machineLearning.clip.modelName} />
        <HelperText>
          <FormatMessage key="admin.machine_learning_clip_model_description">
            {#snippet children({ message })}
              <Link href="https://huggingface.co/immich-app"><u>{message}</u></Link>
            {/snippet}
          </FormatMessage>
        </HelperText>
      </Field>
    </SystemSettingsCard>

    <SystemSettingsCard
      title={$t('admin.machine_learning_duplicate_detection')}
      subtitle={$t('admin.machine_learning_duplicate_detection_setting_description')}
    >
      <Field
        label={$t('admin.machine_learning_duplicate_detection_enabled')}
        description={$t('admin.machine_learning_duplicate_detection_enabled_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
      >
        <Switch bind:checked={configToEdit.machineLearning.duplicateDetection.enabled} />
      </Field>

      <Field
        label={$t('admin.machine_learning_max_detection_distance')}
        description={$t('admin.machine_learning_max_detection_distance_description')}
        disabled={disabled || !featureFlagsManager.value.duplicateDetection}
      >
        <NumberInput
          bind:value={configToEdit.machineLearning.duplicateDetection.maxDistance}
          step="0.0005"
          min={0.001}
          max={0.1}
        />
      </Field>
    </SystemSettingsCard>

    <SystemSettingsCard
      title={$t('admin.machine_learning_facial_recognition')}
      subtitle={$t('admin.machine_learning_facial_recognition_description')}
    >
      <Field
        label={$t('admin.machine_learning_facial_recognition_setting')}
        description={$t('admin.machine_learning_facial_recognition_setting_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled}
      >
        <Switch bind:checked={configToEdit.machineLearning.facialRecognition.enabled} />
      </Field>

      <SettingSelect
        label={$t('admin.machine_learning_facial_recognition_model')}
        desc={$t('admin.machine_learning_facial_recognition_model_description')}
        name="facial-recognition-model"
        bind:value={configToEdit.machineLearning.facialRecognition.modelName}
        options={[
          { value: 'antelopev2', text: 'antelopev2' },
          { value: 'buffalo_l', text: 'buffalo_l' },
          { value: 'buffalo_m', text: 'buffalo_m' },
          { value: 'buffalo_s', text: 'buffalo_s' },
        ]}
        disabled={disabled ||
          !configToEdit.machineLearning.enabled ||
          !configToEdit.machineLearning.facialRecognition.enabled}
        isEdited={configToEdit.machineLearning.facialRecognition.modelName !==
          config.machineLearning.facialRecognition.modelName}
      />

      <Field
        label={$t('admin.machine_learning_min_detection_score')}
        description={$t('admin.machine_learning_min_detection_score_description')}
        disabled={disabled ||
          !configToEdit.machineLearning.enabled ||
          !configToEdit.machineLearning.facialRecognition.enabled}
      >
        <NumberInput
          bind:value={configToEdit.machineLearning.facialRecognition.minScore}
          step="0.01"
          min={0.1}
          max={1}
        />
      </Field>

      <Field
        label={$t('admin.machine_learning_max_recognition_distance')}
        description={$t('admin.machine_learning_max_recognition_distance_description')}
        disabled={disabled ||
          !configToEdit.machineLearning.enabled ||
          !configToEdit.machineLearning.facialRecognition.enabled}
      >
        <NumberInput
          bind:value={configToEdit.machineLearning.facialRecognition.maxDistance}
          step="0.01"
          min={0.1}
          max={2}
        />
      </Field>
      <Field
        label={$t('admin.machine_learning_min_recognized_faces')}
        description={$t('admin.machine_learning_min_recognized_faces_description')}
        disabled={disabled ||
          !configToEdit.machineLearning.enabled ||
          !configToEdit.machineLearning.facialRecognition.enabled}
      >
        <NumberInput bind:value={configToEdit.machineLearning.facialRecognition.minFaces} step="1" min={1} />
      </Field>
    </SystemSettingsCard>

    <SystemSettingsCard
      title={$t('admin.machine_learning_ocr')}
      subtitle={$t('admin.machine_learning_ocr_description')}
    >
      <Field
        label={$t('admin.machine_learning_ocr_enabled')}
        description={$t('admin.machine_learning_ocr_enabled_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled}
      >
        <Switch bind:checked={configToEdit.machineLearning.ocr.enabled} />
      </Field>

      <SettingSelect
        label={$t('admin.machine_learning_ocr_model')}
        desc={$t('admin.machine_learning_ocr_model_description')}
        name="ocr-model"
        bind:value={configToEdit.machineLearning.ocr.modelName}
        options={[
          { text: 'PP-OCRv5_server (Chinese, Japanese and English)', value: 'PP-OCRv5_server' },
          { text: 'PP-OCRv5_mobile (Chinese, Japanese and English)', value: 'PP-OCRv5_mobile' },
          { text: 'PP-OCRv5_mobile (English-only)', value: 'EN__PP-OCRv5_mobile' },
          { text: 'PP-OCRv5_mobile (Greek and English)', value: 'EL__PP-OCRv5_mobile' },
          { text: 'PP-OCRv5_mobile (Korean and English)', value: 'KOREAN__PP-OCRv5_mobile' },
          { text: 'PP-OCRv5_mobile (Latin script languages)', value: 'LATIN__PP-OCRv5_mobile' },
          { text: 'PP-OCRv5_mobile (Russian, Belarusian, Ukrainian and English)', value: 'ESLAV__PP-OCRv5_mobile' },
          { text: 'PP-OCRv5_mobile (Thai and English)', value: 'TH__PP-OCRv5_mobile' },
        ]}
        disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
        isEdited={configToEdit.machineLearning.ocr.modelName !== config.machineLearning.ocr.modelName}
      />

      <Field
        label={$t('admin.machine_learning_ocr_min_detection_score')}
        description={$t('admin.machine_learning_ocr_min_detection_score_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
      >
        <NumberInput bind:value={configToEdit.machineLearning.ocr.minDetectionScore} step="0.1" min={0.1} max={1} />
      </Field>

      <Field
        label={$t('admin.machine_learning_ocr_min_recognition_score')}
        description={$t('admin.machine_learning_ocr_min_score_recognition_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
      >
        <NumberInput bind:value={configToEdit.machineLearning.ocr.minRecognitionScore} step="0.1" min={0.1} max={1} />
      </Field>

      <Field
        label={$t('admin.machine_learning_ocr_max_resolution')}
        description={$t('admin.machine_learning_ocr_max_resolution_description')}
        disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
      >
        <NumberInput bind:value={configToEdit.machineLearning.ocr.maxResolution} min={1} />
      </Field>
    </SystemSettingsCard>
  {/snippet}
</SystemSettingsModal>
