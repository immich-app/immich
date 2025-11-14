<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingCheckboxes from '$lib/components/shared-components/settings/setting-checkboxes.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import {
    AudioCodec,
    CQMode,
    ToneMapping,
    TranscodeHWAccel,
    TranscodePolicy,
    VideoCodec,
    VideoContainer,
  } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiHelpCircleOutline } from '@mdi/js';
  import { isEqual, sortBy } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" onsubmit={(event) => event.preventDefault()}>
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
              bind:value={configToEdit.ffmpeg.transcode}
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
              isEdited={configToEdit.ffmpeg.transcode !== config.ffmpeg.transcode}
            />

            <SettingCheckboxes
              label={$t('admin.transcoding_accepted_video_codecs')}
              {disabled}
              desc={$t('admin.transcoding_accepted_video_codecs_description')}
              bind:value={configToEdit.ffmpeg.acceptedVideoCodecs}
              name="videoCodecs"
              options={[
                { value: VideoCodec.H264, text: 'H.264' },
                { value: VideoCodec.Hevc, text: 'HEVC' },
                { value: VideoCodec.Vp9, text: 'VP9' },
                { value: VideoCodec.Av1, text: 'AV1' },
              ]}
              isEdited={!isEqual(
                sortBy(configToEdit.ffmpeg.acceptedVideoCodecs),
                sortBy(config.ffmpeg.acceptedVideoCodecs),
              )}
            />

            <SettingCheckboxes
              label={$t('admin.transcoding_accepted_audio_codecs')}
              {disabled}
              desc={$t('admin.transcoding_accepted_audio_codecs_description')}
              bind:value={configToEdit.ffmpeg.acceptedAudioCodecs}
              name="audioCodecs"
              options={[
                { value: AudioCodec.Aac, text: 'AAC' },
                { value: AudioCodec.Mp3, text: 'MP3' },
                { value: AudioCodec.Libopus, text: 'Opus' },
                { value: AudioCodec.PcmS16Le, text: 'PCM (16 bit)' },
              ]}
              isEdited={!isEqual(
                sortBy(configToEdit.ffmpeg.acceptedAudioCodecs),
                sortBy(config.ffmpeg.acceptedAudioCodecs),
              )}
            />

            <SettingCheckboxes
              label={$t('admin.transcoding_accepted_containers')}
              {disabled}
              desc={$t('admin.transcoding_accepted_containers_description')}
              bind:value={configToEdit.ffmpeg.acceptedContainers}
              name="videoContainers"
              options={[
                { value: VideoContainer.Mov, text: 'MOV' },
                { value: VideoContainer.Ogg, text: 'Ogg' },
                { value: VideoContainer.Webm, text: 'WebM' },
              ]}
              isEdited={!isEqual(
                sortBy(configToEdit.ffmpeg.acceptedContainers),
                sortBy(config.ffmpeg.acceptedContainers),
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
              bind:value={configToEdit.ffmpeg.targetVideoCodec}
              options={[
                { value: VideoCodec.H264, text: 'h264' },
                { value: VideoCodec.Hevc, text: 'hevc' },
                { value: VideoCodec.Vp9, text: 'vp9' },
                { value: VideoCodec.Av1, text: 'av1' },
              ]}
              name="vcodec"
              isEdited={configToEdit.ffmpeg.targetVideoCodec !== config.ffmpeg.targetVideoCodec}
              onSelect={() => (configToEdit.ffmpeg.acceptedVideoCodecs = [configToEdit.ffmpeg.targetVideoCodec])}
            />

            <!-- PCM is excluded here since it's a bad choice for users storage-wise -->
            <SettingSelect
              label={$t('admin.transcoding_audio_codec')}
              {disabled}
              desc={$t('admin.transcoding_audio_codec_description')}
              bind:value={configToEdit.ffmpeg.targetAudioCodec}
              options={[
                { value: AudioCodec.Aac, text: 'aac' },
                { value: AudioCodec.Mp3, text: 'mp3' },
                { value: AudioCodec.Libopus, text: 'opus' },
              ]}
              name="acodec"
              isEdited={configToEdit.ffmpeg.targetAudioCodec !== config.ffmpeg.targetAudioCodec}
              onSelect={() =>
                configToEdit.ffmpeg.acceptedAudioCodecs.includes(configToEdit.ffmpeg.targetAudioCodec)
                  ? null
                  : configToEdit.ffmpeg.acceptedAudioCodecs.push(configToEdit.ffmpeg.targetAudioCodec)}
            />

            <SettingSelect
              label={$t('admin.transcoding_target_resolution')}
              {disabled}
              desc={$t('admin.transcoding_target_resolution_description')}
              bind:value={configToEdit.ffmpeg.targetResolution}
              options={[
                { value: '2160', text: '4k' },
                { value: '1440', text: '1440p' },
                { value: '1080', text: '1080p' },
                { value: '720', text: '720p' },
                { value: '480', text: '480p' },
                { value: 'original', text: $t('original') },
              ]}
              name="resolution"
              isEdited={configToEdit.ffmpeg.targetResolution !== config.ffmpeg.targetResolution}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label={$t('admin.transcoding_constant_rate_factor')}
              description={$t('admin.transcoding_constant_rate_factor_description')}
              bind:value={configToEdit.ffmpeg.crf}
              required={true}
              isEdited={configToEdit.ffmpeg.crf !== config.ffmpeg.crf}
            />

            <SettingSelect
              label={$t('admin.transcoding_preset_preset')}
              {disabled}
              desc={$t('admin.transcoding_preset_preset_description')}
              bind:value={configToEdit.ffmpeg.preset}
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
              isEdited={configToEdit.ffmpeg.preset !== config.ffmpeg.preset}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              {disabled}
              label={$t('admin.transcoding_max_bitrate')}
              description={$t('admin.transcoding_max_bitrate_description')}
              bind:value={configToEdit.ffmpeg.maxBitrate}
              isEdited={configToEdit.ffmpeg.maxBitrate !== config.ffmpeg.maxBitrate}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              {disabled}
              label={$t('admin.transcoding_threads')}
              description={$t('admin.transcoding_threads_description')}
              bind:value={configToEdit.ffmpeg.threads}
              isEdited={configToEdit.ffmpeg.threads !== config.ffmpeg.threads}
            />

            <SettingSelect
              label={$t('admin.transcoding_tone_mapping')}
              {disabled}
              desc={$t('admin.transcoding_tone_mapping_description')}
              bind:value={configToEdit.ffmpeg.tonemap}
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
              isEdited={configToEdit.ffmpeg.tonemap !== config.ffmpeg.tonemap}
            />

            <SettingSwitch
              title={$t('admin.transcoding_two_pass_encoding')}
              {disabled}
              subtitle={$t('admin.transcoding_two_pass_encoding_setting_description')}
              bind:checked={configToEdit.ffmpeg.twoPass}
              isEdited={configToEdit.ffmpeg.twoPass !== config.ffmpeg.twoPass}
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
              bind:value={configToEdit.ffmpeg.accel}
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
              isEdited={configToEdit.ffmpeg.accel !== config.ffmpeg.accel}
            />

            <SettingSwitch
              title={$t('admin.transcoding_hardware_decoding')}
              {disabled}
              subtitle={$t('admin.transcoding_hardware_decoding_setting_description')}
              bind:checked={configToEdit.ffmpeg.accelDecode}
              isEdited={configToEdit.ffmpeg.accelDecode !== config.ffmpeg.accelDecode}
            />

            <SettingSelect
              label={$t('admin.transcoding_constant_quality_mode')}
              desc={$t('admin.transcoding_constant_quality_mode_description')}
              bind:value={configToEdit.ffmpeg.cqMode}
              options={[
                { value: CQMode.Auto, text: 'Auto' },
                { value: CQMode.Icq, text: 'ICQ' },
                { value: CQMode.Cqp, text: 'CQP' },
              ]}
              isEdited={configToEdit.ffmpeg.cqMode !== config.ffmpeg.cqMode}
              {disabled}
            />

            <SettingSwitch
              title={$t('admin.transcoding_temporal_aq')}
              {disabled}
              subtitle={$t('admin.transcoding_temporal_aq_description')}
              bind:checked={configToEdit.ffmpeg.temporalAQ}
              isEdited={configToEdit.ffmpeg.temporalAQ !== config.ffmpeg.temporalAQ}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={$t('admin.transcoding_preferred_hardware_device')}
              description={$t('admin.transcoding_preferred_hardware_device_description')}
              bind:value={configToEdit.ffmpeg.preferredHwDevice}
              isEdited={configToEdit.ffmpeg.preferredHwDevice !== config.ffmpeg.preferredHwDevice}
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
              bind:value={configToEdit.ffmpeg.bframes}
              isEdited={configToEdit.ffmpeg.bframes !== config.ffmpeg.bframes}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_reference_frames')}
              description={$t('admin.transcoding_reference_frames_description')}
              bind:value={configToEdit.ffmpeg.refs}
              isEdited={configToEdit.ffmpeg.refs !== config.ffmpeg.refs}
              {disabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.transcoding_max_keyframe_interval')}
              description={$t('admin.transcoding_max_keyframe_interval_description')}
              bind:value={configToEdit.ffmpeg.gopSize}
              isEdited={configToEdit.ffmpeg.gopSize !== config.ffmpeg.gopSize}
              {disabled}
            />
          </div>
        </SettingAccordion>
      </div>

      <div class="ms-4">
        <SettingButtonsRow bind:configToEdit keys={['ffmpeg']} {disabled} />
      </div>
    </form>
  </div>
</div>
