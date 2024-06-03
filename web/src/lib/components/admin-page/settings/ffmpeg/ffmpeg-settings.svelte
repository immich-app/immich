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
          desc="Video quality level. Typical values are 23 for H.264, 28 for HEVC, 31 for VP9, and 35 for AV1. Lower is better, but produces larger files."
          bind:value={config.ffmpeg.crf}
          required={true}
          isEdited={config.ffmpeg.crf !== savedConfig.ffmpeg.crf}
        />

        <SettingSelect
          label={$t('preset_preset')}
          {disabled}
          desc="Compression speed. Slower presets produce smaller files, and increase quality when targeting a certain bitrate. VP9 ignores speeds above faster."
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
          desc="Opus is the highest quality option, but has lower compatibility with old devices or software."
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
          desc="Select which audio codecs do not need to be transcoded. Only used for certain transcode policies."
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
          desc="VP9 has high efficiency and web compatibility, but takes longer to transcode. HEVC performs similarly, but has lower web compatibility. H.264 is widely compatible and quick to transcode, but produces much larger files. AV1 is the most efficient codec but lacks support on older devices."
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
          desc="Select which video codecs do not need to be transcoded. Only used for certain transcode policies."
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
          desc="Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness."
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
          desc="Setting a max bitrate can make file sizes more predictable at a minor cost to quality. At 720p, typical values are 2600k for VP9 or HEVC, or 4500k for H.264. Disabled if set to 0."
          bind:value={config.ffmpeg.maxBitrate}
          isEdited={config.ffmpeg.maxBitrate !== savedConfig.ffmpeg.maxBitrate}
        />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label={$t('threads').toUpperCase()}
          desc="Higher values lead to faster encoding, but leave less room for the server to process other tasks while active. This value should not be more than the number of CPU cores. Maximizes utilization if set to 0."
          bind:value={config.ffmpeg.threads}
          isEdited={config.ffmpeg.threads !== savedConfig.ffmpeg.threads}
        />

        <SettingSelect
          label={$t('transcode_policy').toUpperCase()}
          {disabled}
          desc="Policy for when a video should be transcoded. HDR videos will always be transcoded (except if transcoding is disabled)."
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
          desc="Attempts to preserve the appearance of HDR videos when converted to SDR. Each algorithm makes different tradeoffs for color, detail and brightness. Hable preserves detail, Mobius preserves color, and Reinhard preserves brightness."
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
<<<<<<< HEAD
          title={$t('two-pass_encoding')}
=======
          id="two-pass-encoding"
          title={$t('two-pass_encoding').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
          {disabled}
          subtitle="Transcode in two passes to produce better encoded videos. When max bitrate is enabled (required for it to work with H.264 and HEVC), this mode uses a bitrate range based on the max bitrate and ignores CRF. For VP9, CRF can be used if max bitrate is disabled."
          bind:checked={config.ffmpeg.twoPass}
          isEdited={config.ffmpeg.twoPass !== savedConfig.ffmpeg.twoPass}
        />

        <SettingAccordion
          key="hardware-acceleration"
          title={$t('hardware_acceleration')}
          subtitle="Experimental; much faster, but will have lower quality at the same bitrate"
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label={$t('acceleration_api').toUpperCase()}
              {disabled}
              desc="The API that will interact with your device to accelerate transcoding. This setting is 'best effort': it will fallback to software transcoding on failure. VP9 may or may not work depending on your hardware."
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
<<<<<<< HEAD
              title={$t('hardware_decoding')}
=======
              id="hardware-decoding"
              title={$t('hardware_decoding').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
              {disabled}
              subtitle="Applies only to NVENC and RKMPP. Enables end-to-end acceleration instead of only accelerating encoding. May not work on all videos."
              bind:checked={config.ffmpeg.accelDecode}
              isEdited={config.ffmpeg.accelDecode !== savedConfig.ffmpeg.accelDecode}
            />

            <SettingSelect
              label={$t('constant_quality_mode').toUpperCase()}
              desc="ICQ is better than CQP, but some hardware acceleration devices do not support this mode. Setting this option will prefer the specified mode when using quality-based encoding. Ignored by NVENC as it does not support ICQ."
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
<<<<<<< HEAD
              title={$t('temporal_aq')}
=======
              id="temporal-aq"
              title={$t('temporal_aq').toUpperCase()}
>>>>>>> 4dcb5a3a3 (Fix lower and uppercase strings. Add a few additional string. Fix a few unnecessary replacements)
              {disabled}
              subtitle="Applies only to NVENC. Increases quality of high-detail, low-motion scenes. May not be compatible with older devices."
              bind:checked={config.ffmpeg.temporalAQ}
              isEdited={config.ffmpeg.temporalAQ !== savedConfig.ffmpeg.temporalAQ}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('preferred_hardware_device').toUpperCase()}
              desc="Applies only to VAAPI and QSV. Sets the dri node used for hardware transcoding."
              bind:value={config.ffmpeg.preferredHwDevice}
              isEdited={config.ffmpeg.preferredHwDevice !== savedConfig.ffmpeg.preferredHwDevice}
              {disabled}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion
          key="advanced-options"
          title={$t('advanced')}
          subtitle="Options most users should not need to change"
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('tone-mapping_npl').toUpperCase()}
              desc="Colors will be adjusted to look normal for a display of this brightness. Counter-intuitively, lower values increase the brightness of the video and vice versa since it compensates for the brightness of the display. 0 sets this value automatically."
              bind:value={config.ffmpeg.npl}
              isEdited={config.ffmpeg.npl !== savedConfig.ffmpeg.npl}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('max_b-frames').toUpperCase()}
              desc="Higher values improve compression efficiency, but slow down encoding. May not be compatible with hardware acceleration on older devices. 0 disables B-frames, while -1 sets this value automatically."
              bind:value={config.ffmpeg.bframes}
              isEdited={config.ffmpeg.bframes !== savedConfig.ffmpeg.bframes}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('reference_frames').toUpperCase()}
              desc="The number of frames to reference when compressing a given frame. Higher values improve compression efficiency, but slow down encoding. 0 sets this value automatically."
              bind:value={config.ffmpeg.refs}
              isEdited={config.ffmpeg.refs !== savedConfig.ffmpeg.refs}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('max_keyframe_interval').toUpperCase()}
              desc="Sets the maximum frame distance between keyframes. Lower values worsen compression efficiency, but improve seek times and may improve quality in scenes with fast movement. 0 sets this value automatically."
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
