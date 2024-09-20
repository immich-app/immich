<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
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
  import { mdiHelpCircleOutline } from '@mdi/js';
  import { isEqual, sortBy } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingCheckboxes from '$lib/components/shared-components/settings/setting-checkboxes.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <p class="text-sm dark:text-immich-dark-fg">
          <Icon path={mdiHelpCircleOutline} class="inline" size="15" />
          <FormatMessage key="admin.transcoding_codecs_learn_more" let:tag let:message>
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
          </FormatMessage>
        </p>

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label={$t('admin.transcoding_constant_rate_factor')}
          desc={$t('admin.transcoding_constant_rate_factor_description')}
          bind:value={config.ffmpeg.crf}
          required={true}
          isEdited={config.ffmpeg.crf !== savedConfig.ffmpeg.crf}
        />

        <SettingSelect
          label={$t('admin.transcoding_preset_preset')}
          {disabled}
          desc={$t('admin.transcoding_preset_preset_description')}
          bind:value={config.ffmpeg.preset}
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
          isEdited={config.ffmpeg.preset !== savedConfig.ffmpeg.preset}
        />

        <SettingSelect
          label={$t('admin.transcoding_video_codec')}
          {disabled}
          desc={$t('admin.transcoding_video_codec_description')}
          bind:value={config.ffmpeg.targetVideoCodec}
          options={[
            { value: VideoCodec.H264, text: 'h264' },
            { value: VideoCodec.Hevc, text: 'hevc' },
            { value: VideoCodec.Vp9, text: 'vp9' },
            { value: VideoCodec.Av1, text: 'av1' },
          ]}
          name="vcodec"
          isEdited={config.ffmpeg.targetVideoCodec !== savedConfig.ffmpeg.targetVideoCodec}
          onSelect={() => (config.ffmpeg.acceptedVideoCodecs = [config.ffmpeg.targetVideoCodec])}
        />

        <SettingSelect
          label={$t('admin.transcoding_audio_codec')}
          {disabled}
          desc={$t('admin.transcoding_audio_codec_description')}
          bind:value={config.ffmpeg.targetAudioCodec}
          options={[
            { value: AudioCodec.Aac, text: 'aac' },
            { value: AudioCodec.Mp3, text: 'mp3' },
            { value: AudioCodec.Libopus, text: 'opus' },
          ]}
          name="acodec"
          isEdited={config.ffmpeg.targetAudioCodec !== savedConfig.ffmpeg.targetAudioCodec}
          onSelect={() =>
            config.ffmpeg.acceptedAudioCodecs.includes(config.ffmpeg.targetAudioCodec)
              ? null
              : config.ffmpeg.acceptedAudioCodecs.push(config.ffmpeg.targetAudioCodec)}
        />

        <SettingCheckboxes
          label={$t('admin.transcoding_accepted_video_codecs')}
          {disabled}
          desc={$t('admin.transcoding_accepted_video_codecs_description')}
          bind:value={config.ffmpeg.acceptedVideoCodecs}
          name="videoCodecs"
          options={[
            { value: VideoCodec.H264, text: 'H.264' },
            { value: VideoCodec.Hevc, text: 'HEVC' },
            { value: VideoCodec.Vp9, text: 'VP9' },
            { value: VideoCodec.Av1, text: 'AV1' },
          ]}
          isEdited={!isEqual(sortBy(config.ffmpeg.acceptedVideoCodecs), sortBy(savedConfig.ffmpeg.acceptedVideoCodecs))}
        />

        <SettingCheckboxes
          label={$t('admin.transcoding_accepted_audio_codecs')}
          {disabled}
          desc={$t('admin.transcoding_accepted_audio_codecs_description')}
          bind:value={config.ffmpeg.acceptedAudioCodecs}
          name="audioCodecs"
          options={[
            { value: AudioCodec.Aac, text: 'AAC' },
            { value: AudioCodec.Mp3, text: 'MP3' },
            { value: AudioCodec.Libopus, text: 'Opus' },
          ]}
          isEdited={!isEqual(sortBy(config.ffmpeg.acceptedAudioCodecs), sortBy(savedConfig.ffmpeg.acceptedAudioCodecs))}
        />

        <SettingCheckboxes
          label={$t('admin.transcoding_accepted_containers')}
          {disabled}
          desc={$t('admin.transcoding_accepted_containers_description')}
          bind:value={config.ffmpeg.acceptedContainers}
          name="videoContainers"
          options={[
            { value: VideoContainer.Mov, text: 'MOV' },
            { value: VideoContainer.Ogg, text: 'Ogg' },
            { value: VideoContainer.Webm, text: 'WebM' },
          ]}
          isEdited={!isEqual(sortBy(config.ffmpeg.acceptedContainers), sortBy(savedConfig.ffmpeg.acceptedContainers))}
        />

        <SettingSelect
          label={$t('admin.transcoding_target_resolution')}
          {disabled}
          desc={$t('admin.transcoding_target_resolution_description')}
          bind:value={config.ffmpeg.targetResolution}
          options={[
            { value: '2160', text: '4k' },
            { value: '1440', text: '1440p' },
            { value: '1080', text: '1080p' },
            { value: '720', text: '720p' },
            { value: '480', text: '480p' },
            { value: 'original', text: $t('original') },
          ]}
          name="resolution"
          isEdited={config.ffmpeg.targetResolution !== savedConfig.ffmpeg.targetResolution}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          {disabled}
          label={$t('admin.transcoding_max_bitrate')}
          desc={$t('admin.transcoding_max_bitrate_description')}
          bind:value={config.ffmpeg.maxBitrate}
          isEdited={config.ffmpeg.maxBitrate !== savedConfig.ffmpeg.maxBitrate}
        />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label={$t('admin.transcoding_threads')}
          desc={$t('admin.transcoding_threads_description')}
          bind:value={config.ffmpeg.threads}
          isEdited={config.ffmpeg.threads !== savedConfig.ffmpeg.threads}
        />

        <SettingSelect
          label={$t('admin.transcoding_transcode_policy')}
          {disabled}
          desc={$t('admin.transcoding_transcode_policy_description')}
          bind:value={config.ffmpeg.transcode}
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
          isEdited={config.ffmpeg.transcode !== savedConfig.ffmpeg.transcode}
        />

        <SettingSelect
          label={$t('admin.transcoding_tone_mapping')}
          {disabled}
          desc={$t('admin.transcoding_tone_mapping_description')}
          bind:value={config.ffmpeg.tonemap}
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
          isEdited={config.ffmpeg.tonemap !== savedConfig.ffmpeg.tonemap}
        />

        <SettingSwitch
          title={$t('admin.transcoding_two_pass_encoding')}
          {disabled}
          subtitle={$t('admin.transcoding_two_pass_encoding_setting_description')}
          bind:checked={config.ffmpeg.twoPass}
          isEdited={config.ffmpeg.twoPass !== savedConfig.ffmpeg.twoPass}
        />

        <SettingAccordion
          key="hardware-acceleration"
          title={$t('admin.transcoding_hardware_acceleration')}
          subtitle={$t('admin.transcoding_hardware_acceleration_description')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label={$t('admin.transcoding_acceleration_api')}
              {disabled}
              desc={$t('admin.transcoding_acceleration_api_description')}
              bind:value={config.ffmpeg.accel}
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
              isEdited={config.ffmpeg.accel !== savedConfig.ffmpeg.accel}
            />

            <SettingSwitch
              title={$t('admin.transcoding_hardware_decoding')}
              {disabled}
              subtitle={$t('admin.transcoding_hardware_decoding_setting_description')}
              bind:checked={config.ffmpeg.accelDecode}
              isEdited={config.ffmpeg.accelDecode !== savedConfig.ffmpeg.accelDecode}
            />

            <SettingSelect
              label={$t('admin.transcoding_constant_quality_mode')}
              desc={$t('admin.transcoding_constant_quality_mode_description')}
              bind:value={config.ffmpeg.cqMode}
              options={[
                { value: CQMode.Auto, text: 'Auto' },
                { value: CQMode.Icq, text: 'ICQ' },
                { value: CQMode.Cqp, text: 'CQP' },
              ]}
              isEdited={config.ffmpeg.cqMode !== savedConfig.ffmpeg.cqMode}
              {disabled}
            />

            <SettingSwitch
              title={$t('admin.transcoding_temporal_aq')}
              {disabled}
              subtitle={$t('admin.transcoding_temporal_aq_description')}
              bind:checked={config.ffmpeg.temporalAQ}
              isEdited={config.ffmpeg.temporalAQ !== savedConfig.ffmpeg.temporalAQ}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.transcoding_preferred_hardware_device')}
              desc={$t('admin.transcoding_preferred_hardware_device_description')}
              bind:value={config.ffmpeg.preferredHwDevice}
              isEdited={config.ffmpeg.preferredHwDevice !== savedConfig.ffmpeg.preferredHwDevice}
              {disabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="advanced-options"
          title={$t('advanced')}
          subtitle={$t('admin.transcoding_advanced_options_description')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_tone_mapping_npl')}
              desc={$t('admin.transcoding_tone_mapping_npl_description')}
              bind:value={config.ffmpeg.npl}
              isEdited={config.ffmpeg.npl !== savedConfig.ffmpeg.npl}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_max_b_frames')}
              desc={$t('admin.transcoding_max_b_frames_description')}
              bind:value={config.ffmpeg.bframes}
              isEdited={config.ffmpeg.bframes !== savedConfig.ffmpeg.bframes}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_reference_frames')}
              desc={$t('admin.transcoding_reference_frames_description')}
              bind:value={config.ffmpeg.refs}
              isEdited={config.ffmpeg.refs !== savedConfig.ffmpeg.refs}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_max_keyframe_interval')}
              desc={$t('admin.transcoding_max_keyframe_interval_description')}
              bind:value={config.ffmpeg.gopSize}
              isEdited={config.ffmpeg.gopSize !== savedConfig.ffmpeg.gopSize}
              {disabled}
            />
          </div>
        </SettingAccordion>
      </div>

      <div class="ml-4">
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
