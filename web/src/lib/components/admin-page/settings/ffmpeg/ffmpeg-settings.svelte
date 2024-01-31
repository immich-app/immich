<script lang="ts">
  import {
    AudioCodec,
    CQMode,
    type SystemConfigDto,
    ToneMapping,
    TranscodeHWAccel,
    TranscodePolicy,
    VideoCodec,
  } from '@api';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSelect from '../setting-select.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingCheckboxes from '../setting-checkboxes.svelte';
  import { isEqual, sortBy } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingAccordion from '../setting-accordion.svelte';
  import { mdiHelpCircleOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { SettingsEventType } from '../admin-settings';

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
            >HEVC codec</a
          >
          and
          <a href="https://trac.ffmpeg.org/wiki/Encode/VP9" class="underline" target="_blank" rel="noreferrer"
            >VP9 codec</a
          >.
        </p>

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label="CONSTANT RATE FACTOR (-crf)"
          desc="Video quality level. Typical values are 23 for H.264, 28 for HEVC, and 31 for VP9. Lower is better, but takes longer to encode and produces larger files."
          bind:value={config.ffmpeg.crf}
          required={true}
          isEdited={config.ffmpeg.crf !== savedConfig.ffmpeg.crf}
        />

        <SettingSelect
          label="PRESET (-preset)"
          {disabled}
          desc="Compression speed. Slower presets produce smaller files, and increase quality when targeting a certain bitrate. VP9 ignores speeds above `faster`."
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
          label="AUDIO CODEC"
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
          on:select={() => (config.ffmpeg.acceptedAudioCodecs = [config.ffmpeg.targetAudioCodec])}
        />

        <SettingCheckboxes
          label="ACCEPTED AUDIO CODECS"
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
          label="VIDEO CODEC"
          {disabled}
          desc="VP9 has high efficiency and web compatibility, but takes longer to transcode. HEVC performs similarly, but has lower web compatibility. H.264 is widely compatible and quick to transcode, but produces much larger files."
          bind:value={config.ffmpeg.targetVideoCodec}
          options={[
            { value: VideoCodec.H264, text: 'h264' },
            { value: VideoCodec.Hevc, text: 'hevc' },
            { value: VideoCodec.Vp9, text: 'vp9' },
          ]}
          name="vcodec"
          isEdited={config.ffmpeg.targetVideoCodec !== savedConfig.ffmpeg.targetVideoCodec}
          on:select={() => (config.ffmpeg.acceptedVideoCodecs = [config.ffmpeg.targetVideoCodec])}
        />

        <SettingCheckboxes
          label="ACCEPTED VIDEO CODECS"
          {disabled}
          desc="Select which video codecs do not need to be transcoded. Only used for certain transcode policies."
          bind:value={config.ffmpeg.acceptedVideoCodecs}
          name="videoCodecs"
          options={[
            { value: VideoCodec.H264, text: 'H.264' },
            { value: VideoCodec.Hevc, text: 'HEVC' },
            { value: VideoCodec.Vp9, text: 'VP9' },
          ]}
          isEdited={!isEqual(sortBy(config.ffmpeg.acceptedVideoCodecs), sortBy(savedConfig.ffmpeg.acceptedVideoCodecs))}
        />

        <SettingSelect
          label="TARGET RESOLUTION"
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
          label="MAX BITRATE"
          desc="Setting a max bitrate can make file sizes more predictable at a minor cost to quality. At 720p, typical values are 2600k for VP9 or HEVC, or 4500k for H.264. Disabled if set to 0."
          bind:value={config.ffmpeg.maxBitrate}
          isEdited={config.ffmpeg.maxBitrate !== savedConfig.ffmpeg.maxBitrate}
        />

        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          {disabled}
          label="THREADS"
          desc="Higher values lead to faster encoding, but leave less room for the server to process other tasks while active. This value should not be more than the number of CPU cores. Maximizes utilization if set to 0."
          bind:value={config.ffmpeg.threads}
          isEdited={config.ffmpeg.threads !== savedConfig.ffmpeg.threads}
        />

        <SettingSelect
          label="TRANSCODE POLICY"
          {disabled}
          desc="Policy for when a video should be transcoded."
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
          label="TONE-MAPPING"
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
          title="TWO-PASS ENCODING"
          {disabled}
          subtitle="Transcode in two passes to produce better encoded videos. When max bitrate is enabled (required for it to work with H.264 and HEVC), this mode uses a bitrate range based on the max bitrate and ignores CRF. For VP9, CRF can be used if max bitrate is disabled."
          bind:checked={config.ffmpeg.twoPass}
          isEdited={config.ffmpeg.twoPass !== savedConfig.ffmpeg.twoPass}
        />

        <SettingAccordion
          title="Hardware Acceleration"
          subtitle="Experimental; much faster, but will have lower quality at the same bitrate"
        >
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSelect
              label="ACCELERATION API"
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

            <SettingSelect
              label="CONSTANT QUALITY MODE"
              desc="ICQ is better than CQP, but some hardware acceleration devices do not support this mode. Setting this option will prefer the specified mode when using quality-based encoding. Ignored by NVENC as it does not support ICQ."
              bind:value={config.ffmpeg.cqMode}
              options={[
                { value: CQMode.Auto, text: 'Auto' },
                { value: CQMode.Icq, text: 'ICQ' },
                { value: CQMode.Cqp, text: 'CQP' },
              ]}
              isEdited={config.ffmpeg.cqMode !== savedConfig.ffmpeg.cqMode}
            />

            <SettingSwitch
              title="TEMPORAL AQ"
              {disabled}
              subtitle="Applies only to NVENC. Increases quality of high-detail, low-motion scenes. May not be compatible with older devices."
              bind:checked={config.ffmpeg.temporalAQ}
              isEdited={config.ffmpeg.temporalAQ !== savedConfig.ffmpeg.temporalAQ}
            />
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="PREFERRED HARDWARE DEVICE FOR TRANSCODING"
              desc="Applies only to VAAPI and QSV. Sets the dri node used for hardware transcoding. Set to 'auto' to let immich decide for you"
              bind:value={config.ffmpeg.preferredHwDevice}
              isEdited={config.ffmpeg.preferredHwDevice !== savedConfig.ffmpeg.preferredHwDevice}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion title="Advanced" subtitle="Options most users should not need to change">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="TONE-MAPPING NPL"
              desc="Colors will be adjusted to look normal for a display of this brightness. Counter-intuitively, lower values increase the brightness of the video and vice versa since it compensates for the brightness of the display. 0 sets this value automatically."
              bind:value={config.ffmpeg.npl}
              isEdited={config.ffmpeg.npl !== savedConfig.ffmpeg.npl}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="MAX B-FRAMES"
              desc="Higher values improve compression efficiency, but slow down encoding. May not be compatible with hardware acceleration on older devices. 0 disables B-frames, while -1 sets this value automatically."
              bind:value={config.ffmpeg.bframes}
              isEdited={config.ffmpeg.bframes !== savedConfig.ffmpeg.bframes}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="REFERENCE FRAMES"
              desc="The number of frames to reference when compressing a given frame. Higher values improve compression efficiency, but slow down encoding. 0 sets this value automatically."
              bind:value={config.ffmpeg.refs}
              isEdited={config.ffmpeg.refs !== savedConfig.ffmpeg.refs}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="MAX KEYFRAME INTERVAL"
              desc="Sets the maximum frame distance between keyframes. Lower values worsen compression efficiency, but improve seek times and may improve quality in scenes with fast movement. 0 sets this value automatically."
              bind:value={config.ffmpeg.gopSize}
              isEdited={config.ffmpeg.gopSize !== savedConfig.ffmpeg.gopSize}
            />
          </div>
        </SettingAccordion>
      </div>

      <div class="ml-4">
        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['ffmpeg'] })}
          on:save={() => dispatch('save', { ffmpeg: config.ffmpeg })}
          showResetToDefault={!isEqual(savedConfig.ffmpeg, defaultConfig)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
