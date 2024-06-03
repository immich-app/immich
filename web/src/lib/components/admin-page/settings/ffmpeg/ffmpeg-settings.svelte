<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    AudioCodec,
    CQMode,
    ToneMapping,
    TranscodeHWAccel,
    TranscodePolicy,
    VideoCodec,
    type SystemConfigDto,
  } from '@immich/sdk';
  import { mdiHelpCircleOutline } from '@mdi/js';
  import { isEqual, sortBy } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingCheckboxes from '$lib/components/shared-components/settings/setting-checkboxes.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <p class="text-sm dark:text-immich-dark-fg">
          <Icon path={mdiHelpCircleOutline} class="inline" size="15" />
          To learn more about the terminology used here, refer to FFmpeg documentation for
          <a href="https://trac.ffmpeg.org/wiki/Encode/H.264" class="underline" target="_blank" rel="noreferrer"
            >H.264 codec</a
          >,
          <a href="https://trac.ffmpeg.org/wiki/Encode/H.265" class="underline" target="_blank" rel="noreferrer"
            >{$t('hevc_codec')}</a
          >
          and
          <a href="https://trac.ffmpeg.org/wiki/Encode/VP9" class="underline" target="_blank" rel="noreferrer"
            >VP9 codec</a
          >.
        </p>

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label={$t('constant_rate_factor_crf')}
          desc={$t('placeholder_41')}
          bind:value={config.ffmpeg.crf}
          required={true}
          isEdited={config.ffmpeg.crf !== savedConfig.ffmpeg.crf}
        />

        <SettingSelect
          label={$t('preset_preset')}
          {disabled}
          desc={$t('placeholder_7')}
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
          label={$t('audio_codec').toUpperCase()}
          {disabled}
          desc={$t('placeholder_22')}
          bind:value={config.ffmpeg.targetAudioCodec}
          options={[
            { value: AudioCodec.Aac, text: 'aac' },
            { value: AudioCodec.Mp3, text: 'mp3' },
            { value: AudioCodec.Libopus, text: 'opus' },
          ]}
          name="acodec"
          isEdited={config.ffmpeg.targetAudioCodec !== savedConfig.ffmpeg.targetAudioCodec}
          on:select={() =>
            config.ffmpeg.acceptedAudioCodecs.includes(config.ffmpeg.targetAudioCodec)
              ? null
              : config.ffmpeg.acceptedAudioCodecs.push(config.ffmpeg.targetAudioCodec)}
        />

        <SettingCheckboxes
          label={$t('accepted_audio_codecs').toUpperCase()}
          {disabled}
          desc={$t('placeholder_27')}
          bind:value={config.ffmpeg.acceptedAudioCodecs}
          name="audioCodecs"
          options={[
            { value: AudioCodec.Aac, text: 'AAC' },
            { value: AudioCodec.Mp3, text: 'MP3' },
            { value: AudioCodec.Libopus, text: 'Opus' },
          ]}
          isEdited={!isEqual(sortBy(config.ffmpeg.acceptedAudioCodecs), sortBy(savedConfig.ffmpeg.acceptedAudioCodecs))}
        />

        <SettingSelect
          label={$t('video_codec').toUpperCase()}
          {disabled}
          desc={$t('placeholder_40')}
          bind:value={config.ffmpeg.targetVideoCodec}
          options={[
            { value: VideoCodec.H264, text: 'h264' },
            { value: VideoCodec.Hevc, text: 'hevc' },
            { value: VideoCodec.Vp9, text: 'vp9' },
            { value: VideoCodec.Av1, text: 'av1' },
          ]}
          name="vcodec"
          isEdited={config.ffmpeg.targetVideoCodec !== savedConfig.ffmpeg.targetVideoCodec}
          on:select={() => (config.ffmpeg.acceptedVideoCodecs = [config.ffmpeg.targetVideoCodec])}
        />

        <SettingCheckboxes
          label={$t('accepted_video_codecs').toUpperCase()}
          {disabled}
          desc={$t('placeholder_28')}
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

        <SettingSelect
          label={$t('target_resolution').toUpperCase()}
          {disabled}
          desc={$t('placeholder_9')}
          bind:value={config.ffmpeg.targetResolution}
          options={[
            { value: '2160', text: '4k' },
            { value: '1440', text: '1440p' },
            { value: '1080', text: '1080p' },
            { value: '720', text: '720p' },
            { value: '480', text: '480p' },
            { value: 'original', text: 'original' },
          ]}
          name="resolution"
          isEdited={config.ffmpeg.targetResolution !== savedConfig.ffmpeg.targetResolution}
        />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          {disabled}
          label={$t('max_bitrate').toUpperCase()}
          desc={$t('placeholder_31')}
          bind:value={config.ffmpeg.maxBitrate}
          isEdited={config.ffmpeg.maxBitrate !== savedConfig.ffmpeg.maxBitrate}
        />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label={$t('threads').toUpperCase()}
          desc={$t('placeholder_11')}
          bind:value={config.ffmpeg.threads}
          isEdited={config.ffmpeg.threads !== savedConfig.ffmpeg.threads}
        />

        <SettingSelect
          label={$t('transcode_policy').toUpperCase()}
          {disabled}
          desc={$t('placeholder_24')}
          bind:value={config.ffmpeg.transcode}
          name="transcode"
          options={[
            { value: TranscodePolicy.All, text: 'All videos' },
            {
              value: TranscodePolicy.Optimal,
              text: 'Videos higher than target resolution or not in an accepted format',
            },
            {
              value: TranscodePolicy.Bitrate,
              text: 'Videos higher than max bitrate or not in an accepted format',
            },
            {
              value: TranscodePolicy.Required,
              text: 'Only videos not in an accepted format',
            },
            {
              value: TranscodePolicy.Disabled,
              text: "Don't transcode any videos, may break playback on some clients",
            },
          ]}
          isEdited={config.ffmpeg.transcode !== savedConfig.ffmpeg.transcode}
        />

        <SettingSelect
          label={$t('tone-mapping').toUpperCase()}
          {disabled}
          desc={$t('placeholder_2')}
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
              text: 'Disabled',
            },
          ]}
          isEdited={config.ffmpeg.tonemap !== savedConfig.ffmpeg.tonemap}
        />

        <SettingSwitch
          title={$t('two-pass_encoding').toUpperCase()}
          {disabled}
          subtitle={$t('placeholder_90')}
          bind:checked={config.ffmpeg.twoPass}
          isEdited={config.ffmpeg.twoPass !== savedConfig.ffmpeg.twoPass}
        />

        <SettingAccordion
          key="hardware-acceleration"
          title={$t('hardware_acceleration')}
          subtitle={$t('placeholder_72')}
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label={$t('acceleration_api').toUpperCase()}
              {disabled}
              desc={$t('placeholder_32')}
              bind:value={config.ffmpeg.accel}
              name="accel"
              options={[
                { value: TranscodeHWAccel.Nvenc, text: 'NVENC (requires NVIDIA GPU)' },
                {
                  value: TranscodeHWAccel.Qsv,
                  text: 'Quick Sync (requires 7th gen Intel CPU or later)',
                },
                {
                  value: TranscodeHWAccel.Vaapi,
                  text: 'VAAPI',
                },
                {
                  value: TranscodeHWAccel.Rkmpp,
                  text: 'RKMPP (only on Rockchip SOCs)',
                },
                {
                  value: TranscodeHWAccel.Disabled,
                  text: 'Disabled',
                },
              ]}
              isEdited={config.ffmpeg.accel !== savedConfig.ffmpeg.accel}
            />

            <SettingSwitch
              title={$t('hardware_decoding').toUpperCase()}
              {disabled}
              subtitle={$t('placeholder_60')}
              bind:checked={config.ffmpeg.accelDecode}
              isEdited={config.ffmpeg.accelDecode !== savedConfig.ffmpeg.accelDecode}
            />

            <SettingSelect
              label={$t('constant_quality_mode').toUpperCase()}
              desc={$t('placeholder_13')}
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
              title={$t('temporal_aq').toUpperCase()}
              {disabled}
              subtitle={$t('placeholder_61')}
              bind:checked={config.ffmpeg.temporalAQ}
              isEdited={config.ffmpeg.temporalAQ !== savedConfig.ffmpeg.temporalAQ}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('preferred_hardware_device').toUpperCase()}
              desc={$t('placeholder_1')}
              bind:value={config.ffmpeg.preferredHwDevice}
              isEdited={config.ffmpeg.preferredHwDevice !== savedConfig.ffmpeg.preferredHwDevice}
              {disabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion key="advanced-options" title={$t('advanced')} subtitle={$t('placeholder_82')}>
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('tone-mapping_npl').toUpperCase()}
              desc={$t('placeholder_6')}
              bind:value={config.ffmpeg.npl}
              isEdited={config.ffmpeg.npl !== savedConfig.ffmpeg.npl}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('max_b-frames').toUpperCase()}
              desc={$t('placeholder_10')}
              bind:value={config.ffmpeg.bframes}
              isEdited={config.ffmpeg.bframes !== savedConfig.ffmpeg.bframes}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('reference_frames').toUpperCase()}
              desc={$t('placeholder_34')}
              bind:value={config.ffmpeg.refs}
              isEdited={config.ffmpeg.refs !== savedConfig.ffmpeg.refs}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('max_keyframe_interval').toUpperCase()}
              desc={$t('placeholder_30')}
              bind:value={config.ffmpeg.gopSize}
              isEdited={config.ffmpeg.gopSize !== savedConfig.ffmpeg.gopSize}
              {disabled}
            />
          </div>
        </SettingAccordion>
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['ffmpeg'] })}
          on:save={() => dispatch('save', { ffmpeg: config.ffmpeg })}
          showResetToDefault={!isEqual(savedConfig.ffmpeg, defaultConfig.ffmpeg)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
