<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingCheckboxes from '$lib/components/shared-components/settings/setting-checkboxes.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import {
    AudioCodec,
    CQMode,
    ToneMapping,
    TranscodeHWAccel,
    TranscodePolicy,
    VideoCodec,
    VideoContainer,
    type SystemConfigDto,
  } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiHelpCircleOutline } from '@mdi/js';
  import { isEqual, sortBy } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from './admin-settings';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <p class="text-sm dark:text-immich-dark-fg">
          <Icon icon={mdiHelpCircleOutline} class="inline" size="15" />
          <FormatMessage key="admin.transcoding_codecs_learn_more">
            {#snippet children({ tag, message })}
              {#if tag === 'h264-link'}
                <a href="https://trac.ffmpeg.org/wiki/Encode/H.264" class="underline" target="_blank" rel="noreferrer">
                  {message}
                </a>
              {:else if tag === 'hevc-link'}
                <a href="https://trac.ffmpeg.org/wiki/Encode/H.265" class="underline" target="_blank" rel="noreferrer">
                  {message}
                </a>
              {:else if tag === 'vp9-link'}
                <a href="https://trac.ffmpeg.org/wiki/Encode/VP9" class="underline" target="_blank" rel="noreferrer">
                  {message}
                </a>
              {/if}
            {/snippet}
          </FormatMessage>
        </p>

        <SettingAccordion
          key="transcoding-policy"
          title={$t('admin.transcoding_policy')}
          subtitle={$t('admin.transcoding_policy_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label={$t('admin.transcoding_transcode_policy')}
              {disabled}
              desc={$t('admin.transcoding_transcode_policy_description')}
              bind:value={config.ffmpeg.offline.transcode}
              name="transcode"
              options={[
                { value: TranscodePolicy.All, text: $t('all_videos') },
                {
                  value: TranscodePolicy.Optimal,
                  text: $t('admin.transcoding_optimal_description'),
                },
                {
                  value: TranscodePolicy.Bitrate,
                  text: $t('admin.transcoding_bitrate_description'),
                },
                {
                  value: TranscodePolicy.Required,
                  text: $t('admin.transcoding_required_description'),
                },
                {
                  value: TranscodePolicy.Disabled,
                  text: $t('admin.transcoding_disabled_description'),
                },
              ]}
              isEdited={config.ffmpeg.offline.transcode !== savedconfig.ffmpeg.offline.transcode}
            />

            <SettingCheckboxes
              label={$t('admin.transcoding_accepted_video_codecs')}
              {disabled}
              desc={$t('admin.transcoding_accepted_video_codecs_description')}
              bind:value={config.ffmpeg.offline.acceptedVideoCodecs}
              name="videoCodecs"
              options={[
                { value: VideoCodec.H264, text: 'H.264' },
                { value: VideoCodec.Hevc, text: 'HEVC' },
                { value: VideoCodec.Vp9, text: 'VP9' },
                { value: VideoCodec.Av1, text: 'AV1' },
              ]}
              isEdited={!isEqual(
                sortBy(config.ffmpeg.offline.acceptedVideoCodecs),
                sortBy(savedconfig.ffmpeg.offline.acceptedVideoCodecs),
              )}
            />

            <SettingCheckboxes
              label={$t('admin.transcoding_accepted_audio_codecs')}
              {disabled}
              desc={$t('admin.transcoding_accepted_audio_codecs_description')}
              bind:value={config.ffmpeg.offline.acceptedAudioCodecs}
              name="audioCodecs"
              options={[
                { value: AudioCodec.Aac, text: 'AAC' },
                { value: AudioCodec.Mp3, text: 'MP3' },
                { value: AudioCodec.Libopus, text: 'Opus' },
                { value: AudioCodec.PcmS16Le, text: 'PCM (16 bit)' },
              ]}
              isEdited={!isEqual(
                sortBy(config.ffmpeg.offline.acceptedAudioCodecs),
                sortBy(savedconfig.ffmpeg.offline.acceptedAudioCodecs),
              )}
            />

            <SettingCheckboxes
              label={$t('admin.transcoding_accepted_containers')}
              {disabled}
              desc={$t('admin.transcoding_accepted_containers_description')}
              bind:value={config.ffmpeg.offline.acceptedContainers}
              name="videoContainers"
              options={[
                { value: VideoContainer.Mov, text: 'MOV' },
                { value: VideoContainer.Ogg, text: 'Ogg' },
                { value: VideoContainer.Webm, text: 'WebM' },
              ]}
              isEdited={!isEqual(
                sortBy(config.ffmpeg.offline.acceptedContainers),
                sortBy(savedconfig.ffmpeg.offline.acceptedContainers),
              )}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="encoding-options"
          title={$t('admin.transcoding_encoding_options')}
          subtitle={$t('admin.transcoding_encoding_options_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label={$t('admin.transcoding_video_codec')}
              {disabled}
              desc={$t('admin.transcoding_video_codec_description')}
              bind:value={config.ffmpeg.offline.targetVideoCodec}
              options={[
                { value: VideoCodec.H264, text: 'h264' },
                { value: VideoCodec.Hevc, text: 'hevc' },
                { value: VideoCodec.Vp9, text: 'vp9' },
                { value: VideoCodec.Av1, text: 'av1' },
              ]}
              name="vcodec"
              isEdited={config.ffmpeg.offline.targetVideoCodec !== savedconfig.ffmpeg.offline.targetVideoCodec}
              onSelect={() => (config.ffmpeg.offline.acceptedVideoCodecs = [config.ffmpeg.offline.targetVideoCodec])}
            />

            <!-- PCM is excluded here since it's a bad choice for users storage-wise -->
            <SettingSelect
              label={$t('admin.transcoding_audio_codec')}
              {disabled}
              desc={$t('admin.transcoding_audio_codec_description')}
              bind:value={config.ffmpeg.offline.targetAudioCodec}
              options={[
                { value: AudioCodec.Aac, text: 'aac' },
                { value: AudioCodec.Mp3, text: 'mp3' },
                { value: AudioCodec.Libopus, text: 'opus' },
              ]}
              name="acodec"
              isEdited={config.ffmpeg.offline.targetAudioCodec !== savedconfig.ffmpeg.offline.targetAudioCodec}
              onSelect={() =>
                config.ffmpeg.offline.acceptedAudioCodecs.includes(config.ffmpeg.offline.targetAudioCodec)
                  ? null
                  : config.ffmpeg.offline.acceptedAudioCodecs.push(config.ffmpeg.offline.targetAudioCodec)}
            />

            <SettingSelect
              label={$t('admin.transcoding_target_resolution')}
              {disabled}
              desc={$t('admin.transcoding_target_resolution_description')}
              bind:value={config.ffmpeg.offline.targetResolution}
              options={[
                { value: '2160', text: '4k' },
                { value: '1440', text: '1440p' },
                { value: '1080', text: '1080p' },
                { value: '720', text: '720p' },
                { value: '480', text: '480p' },
                { value: 'original', text: $t('original') },
              ]}
              name="resolution"
              isEdited={config.ffmpeg.offline.targetResolution !== savedconfig.ffmpeg.offline.targetResolution}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label={$t('admin.transcoding_constant_rate_factor')}
              description={$t('admin.transcoding_constant_rate_factor_description')}
              bind:value={config.ffmpeg.offline.crf}
              required={true}
              isEdited={config.ffmpeg.offline.crf !== savedconfig.ffmpeg.offline.crf}
            />

            <SettingSelect
              label={$t('admin.transcoding_preset_preset')}
              {disabled}
              desc={$t('admin.transcoding_preset_preset_description')}
              bind:value={config.ffmpeg.offline.preset}
              name="preset"
              options={[
                { value: 'ultrafast', text: 'ultrafast' },
                { value: 'superfast', text: 'superfast' },
                { value: 'veryfast', text: 'veryfast' },
                { value: 'faster', text: 'faster' },
                { value: 'fast', text: 'fast' },
                { value: 'medium', text: 'medium' },
                { value: 'slow', text: 'slow' },
                { value: 'slower', text: 'slower' },
                { value: 'veryslow', text: 'veryslow' },
              ]}
              isEdited={config.ffmpeg.offline.preset !== savedconfig.ffmpeg.offline.preset}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              {disabled}
              label={$t('admin.transcoding_max_bitrate')}
              description={$t('admin.transcoding_max_bitrate_description')}
              bind:value={config.ffmpeg.offline.maxBitrate}
              isEdited={config.ffmpeg.offline.maxBitrate !== savedconfig.ffmpeg.offline.maxBitrate}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label={$t('admin.transcoding_threads')}
              description={$t('admin.transcoding_threads_description')}
              bind:value={config.ffmpeg.offline.threads}
              isEdited={config.ffmpeg.offline.threads !== savedconfig.ffmpeg.offline.threads}
            />

            <SettingSelect
              label={$t('admin.transcoding_tone_mapping')}
              {disabled}
              desc={$t('admin.transcoding_tone_mapping_description')}
              bind:value={config.ffmpeg.offline.tonemap}
              name="tonemap"
              options={[
                {
                  value: ToneMapping.Hable,
                  text: 'Hable',
                },
                {
                  value: ToneMapping.Mobius,
                  text: 'Mobius',
                },
                {
                  value: ToneMapping.Reinhard,
                  text: 'Reinhard',
                },
                {
                  value: ToneMapping.Disabled,
                  text: $t('disabled'),
                },
              ]}
              isEdited={config.ffmpeg.offline.tonemap !== savedconfig.ffmpeg.offline.tonemap}
            />

            <SettingSwitch
              title={$t('admin.transcoding_two_pass_encoding')}
              {disabled}
              subtitle={$t('admin.transcoding_two_pass_encoding_setting_description')}
              bind:checked={config.ffmpeg.offline.twoPass}
              isEdited={config.ffmpeg.offline.twoPass !== savedconfig.ffmpeg.offline.twoPass}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="hardware-acceleration"
          title={$t('admin.transcoding_hardware_acceleration')}
          subtitle={$t('admin.transcoding_hardware_acceleration_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label={$t('admin.transcoding_acceleration_api')}
              {disabled}
              desc={$t('admin.transcoding_acceleration_api_description')}
              bind:value={config.ffmpeg.offline.accel}
              name="accel"
              options={[
                { value: TranscodeHWAccel.Nvenc, text: $t('admin.transcoding_acceleration_nvenc') },
                {
                  value: TranscodeHWAccel.Qsv,
                  text: $t('admin.transcoding_acceleration_qsv'),
                },
                {
                  value: TranscodeHWAccel.Vaapi,
                  text: $t('admin.transcoding_acceleration_vaapi'),
                },
                {
                  value: TranscodeHWAccel.Rkmpp,
                  text: $t('admin.transcoding_acceleration_rkmpp'),
                },
                {
                  value: TranscodeHWAccel.Disabled,
                  text: $t('disabled'),
                },
              ]}
              isEdited={config.ffmpeg.offline.accel !== savedconfig.ffmpeg.offline.accel}
            />

            <SettingSwitch
              title={$t('admin.transcoding_hardware_decoding')}
              {disabled}
              subtitle={$t('admin.transcoding_hardware_decoding_setting_description')}
              bind:checked={config.ffmpeg.offline.accelDecode}
              isEdited={config.ffmpeg.offline.accelDecode !== savedconfig.ffmpeg.offline.accelDecode}
            />

            <SettingSelect
              label={$t('admin.transcoding_constant_quality_mode')}
              desc={$t('admin.transcoding_constant_quality_mode_description')}
              bind:value={config.ffmpeg.offline.cqMode}
              options={[
                { value: CQMode.Auto, text: 'Auto' },
                { value: CQMode.Icq, text: 'ICQ' },
                { value: CQMode.Cqp, text: 'CQP' },
              ]}
              isEdited={config.ffmpeg.offline.cqMode !== savedconfig.ffmpeg.offline.cqMode}
              {disabled}
            />

            <SettingSwitch
              title={$t('admin.transcoding_temporal_aq')}
              {disabled}
              subtitle={$t('admin.transcoding_temporal_aq_description')}
              bind:checked={config.ffmpeg.offline.temporalAQ}
              isEdited={config.ffmpeg.offline.temporalAQ !== savedconfig.ffmpeg.offline.temporalAQ}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.transcoding_preferred_hardware_device')}
              description={$t('admin.transcoding_preferred_hardware_device_description')}
              bind:value={config.ffmpeg.offline.preferredHwDevice}
              isEdited={config.ffmpeg.offline.preferredHwDevice !== savedconfig.ffmpeg.offline.preferredHwDevice}
              {disabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="advanced-options"
          title={$t('advanced')}
          subtitle={$t('admin.transcoding_advanced_options_description')}
        >
          <div class="ms-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_max_b_frames')}
              description={$t('admin.transcoding_max_b_frames_description')}
              bind:value={config.ffmpeg.offline.bframes}
              isEdited={config.ffmpeg.offline.bframes !== savedconfig.ffmpeg.offline.bframes}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_reference_frames')}
              description={$t('admin.transcoding_reference_frames_description')}
              bind:value={config.ffmpeg.offline.refs}
              isEdited={config.ffmpeg.offline.refs !== savedconfig.ffmpeg.offline.refs}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_max_keyframe_interval')}
              description={$t('admin.transcoding_max_keyframe_interval_description')}
              bind:value={config.ffmpeg.offline.gopSize}
              isEdited={config.ffmpeg.offline.gopSize !== savedconfig.ffmpeg.offline.gopSize}
              {disabled}
            />
          </div>
        </SettingAccordion>
      </div>

      <div class="ms-4">
        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['ffmpeg'] })}
          onSave={() => onSave({ ffmpeg: config.ffmpeg })}
          showResetToDefault={!isEqual(savedConfig.ffmpeg, defaultConfig.ffmpeg)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
