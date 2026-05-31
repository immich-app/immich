// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigFFmpegDto {
  const SystemConfigFFmpegDto({
    required this.accel,
    required this.accelDecode,
    required this.acceptedAudioCodecs,
    required this.acceptedContainers,
    required this.acceptedVideoCodecs,
    required this.bframes,
    required this.cqMode,
    required this.crf,
    required this.gopSize,
    required this.maxBitrate,
    required this.preferredHwDevice,
    required this.preset,
    required this.refs,
    required this.targetAudioCodec,
    required this.targetResolution,
    required this.targetVideoCodec,
    required this.temporalAq,
    required this.threads,
    required this.tonemap,
    required this.transcode,
    required this.twoPass,
  });

  final TranscodeHwAccel accel;

  /// Accelerated decode
  final bool accelDecode;

  /// Accepted audio codecs
  final List<AudioCodec> acceptedAudioCodecs;

  /// Accepted containers
  final List<VideoContainer> acceptedContainers;

  /// Accepted video codecs
  final List<VideoCodec> acceptedVideoCodecs;

  /// B-frames
  final int bframes;

  final CqMode cqMode;

  /// CRF
  final int crf;

  /// GOP size
  final int gopSize;

  /// Max bitrate
  final String maxBitrate;

  /// Preferred hardware device
  final String preferredHwDevice;

  /// Preset
  final String preset;

  /// References
  final int refs;

  final AudioCodec targetAudioCodec;

  /// Target resolution
  final String targetResolution;

  final VideoCodec targetVideoCodec;

  /// Temporal AQ
  final bool temporalAq;

  /// Threads
  final int threads;

  final ToneMapping tonemap;

  final TranscodePolicy transcode;

  /// Two pass
  final bool twoPass;

  static SystemConfigFFmpegDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigFFmpegDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      accel: (TranscodeHwAccel.fromJson(json[r'accel']))!,
      accelDecode: json[r'accelDecode'] as bool,
      acceptedAudioCodecs: ((json[r'acceptedAudioCodecs'] as List?)
          ?.map(($e) => (AudioCodec.fromJson($e))!)
          .toList(growable: false))!,
      acceptedContainers: ((json[r'acceptedContainers'] as List?)
          ?.map(($e) => (VideoContainer.fromJson($e))!)
          .toList(growable: false))!,
      acceptedVideoCodecs: ((json[r'acceptedVideoCodecs'] as List?)
          ?.map(($e) => (VideoCodec.fromJson($e))!)
          .toList(growable: false))!,
      bframes: json[r'bframes'] as int,
      cqMode: (CqMode.fromJson(json[r'cqMode']))!,
      crf: json[r'crf'] as int,
      gopSize: json[r'gopSize'] as int,
      maxBitrate: json[r'maxBitrate'] as String,
      preferredHwDevice: json[r'preferredHwDevice'] as String,
      preset: json[r'preset'] as String,
      refs: json[r'refs'] as int,
      targetAudioCodec: (AudioCodec.fromJson(json[r'targetAudioCodec']))!,
      targetResolution: json[r'targetResolution'] as String,
      targetVideoCodec: (VideoCodec.fromJson(json[r'targetVideoCodec']))!,
      temporalAq: json[r'temporalAQ'] as bool,
      threads: json[r'threads'] as int,
      tonemap: (ToneMapping.fromJson(json[r'tonemap']))!,
      transcode: (TranscodePolicy.fromJson(json[r'transcode']))!,
      twoPass: json[r'twoPass'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'accel'] = accel.toJson();
    json[r'accelDecode'] = accelDecode;
    json[r'acceptedAudioCodecs'] = acceptedAudioCodecs.map(($e) => $e.toJson()).toList(growable: false);
    json[r'acceptedContainers'] = acceptedContainers.map(($e) => $e.toJson()).toList(growable: false);
    json[r'acceptedVideoCodecs'] = acceptedVideoCodecs.map(($e) => $e.toJson()).toList(growable: false);
    json[r'bframes'] = bframes;
    json[r'cqMode'] = cqMode.toJson();
    json[r'crf'] = crf;
    json[r'gopSize'] = gopSize;
    json[r'maxBitrate'] = maxBitrate;
    json[r'preferredHwDevice'] = preferredHwDevice;
    json[r'preset'] = preset;
    json[r'refs'] = refs;
    json[r'targetAudioCodec'] = targetAudioCodec.toJson();
    json[r'targetResolution'] = targetResolution;
    json[r'targetVideoCodec'] = targetVideoCodec.toJson();
    json[r'temporalAQ'] = temporalAq;
    json[r'threads'] = threads;
    json[r'tonemap'] = tonemap.toJson();
    json[r'transcode'] = transcode.toJson();
    json[r'twoPass'] = twoPass;
    return json;
  }

  SystemConfigFFmpegDto copyWith({
    TranscodeHwAccel? accel,
    bool? accelDecode,
    List<AudioCodec>? acceptedAudioCodecs,
    List<VideoContainer>? acceptedContainers,
    List<VideoCodec>? acceptedVideoCodecs,
    int? bframes,
    CqMode? cqMode,
    int? crf,
    int? gopSize,
    String? maxBitrate,
    String? preferredHwDevice,
    String? preset,
    int? refs,
    AudioCodec? targetAudioCodec,
    String? targetResolution,
    VideoCodec? targetVideoCodec,
    bool? temporalAq,
    int? threads,
    ToneMapping? tonemap,
    TranscodePolicy? transcode,
    bool? twoPass,
  }) {
    return .new(
      accel: accel ?? this.accel,
      accelDecode: accelDecode ?? this.accelDecode,
      acceptedAudioCodecs: acceptedAudioCodecs ?? this.acceptedAudioCodecs,
      acceptedContainers: acceptedContainers ?? this.acceptedContainers,
      acceptedVideoCodecs: acceptedVideoCodecs ?? this.acceptedVideoCodecs,
      bframes: bframes ?? this.bframes,
      cqMode: cqMode ?? this.cqMode,
      crf: crf ?? this.crf,
      gopSize: gopSize ?? this.gopSize,
      maxBitrate: maxBitrate ?? this.maxBitrate,
      preferredHwDevice: preferredHwDevice ?? this.preferredHwDevice,
      preset: preset ?? this.preset,
      refs: refs ?? this.refs,
      targetAudioCodec: targetAudioCodec ?? this.targetAudioCodec,
      targetResolution: targetResolution ?? this.targetResolution,
      targetVideoCodec: targetVideoCodec ?? this.targetVideoCodec,
      temporalAq: temporalAq ?? this.temporalAq,
      threads: threads ?? this.threads,
      tonemap: tonemap ?? this.tonemap,
      transcode: transcode ?? this.transcode,
      twoPass: twoPass ?? this.twoPass,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigFFmpegDto &&
            accel == other.accel &&
            accelDecode == other.accelDecode &&
            const DeepCollectionEquality().equals(acceptedAudioCodecs, other.acceptedAudioCodecs) &&
            const DeepCollectionEquality().equals(acceptedContainers, other.acceptedContainers) &&
            const DeepCollectionEquality().equals(acceptedVideoCodecs, other.acceptedVideoCodecs) &&
            bframes == other.bframes &&
            cqMode == other.cqMode &&
            crf == other.crf &&
            gopSize == other.gopSize &&
            maxBitrate == other.maxBitrate &&
            preferredHwDevice == other.preferredHwDevice &&
            preset == other.preset &&
            refs == other.refs &&
            targetAudioCodec == other.targetAudioCodec &&
            targetResolution == other.targetResolution &&
            targetVideoCodec == other.targetVideoCodec &&
            temporalAq == other.temporalAq &&
            threads == other.threads &&
            tonemap == other.tonemap &&
            transcode == other.transcode &&
            twoPass == other.twoPass);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      accel,
      accelDecode,
      const DeepCollectionEquality().hash(acceptedAudioCodecs),
      const DeepCollectionEquality().hash(acceptedContainers),
      const DeepCollectionEquality().hash(acceptedVideoCodecs),
      bframes,
      cqMode,
      crf,
      gopSize,
      maxBitrate,
      preferredHwDevice,
      preset,
      refs,
      targetAudioCodec,
      targetResolution,
      targetVideoCodec,
      temporalAq,
      threads,
      tonemap,
      transcode,
      twoPass,
    ]);
  }

  @override
  String toString() =>
      'SystemConfigFFmpegDto(accel=$accel, accelDecode=$accelDecode, acceptedAudioCodecs=$acceptedAudioCodecs, acceptedContainers=$acceptedContainers, acceptedVideoCodecs=$acceptedVideoCodecs, bframes=$bframes, cqMode=$cqMode, crf=$crf, gopSize=$gopSize, maxBitrate=$maxBitrate, preferredHwDevice=$preferredHwDevice, preset=$preset, refs=$refs, targetAudioCodec=$targetAudioCodec, targetResolution=$targetResolution, targetVideoCodec=$targetVideoCodec, temporalAq=$temporalAq, threads=$threads, tonemap=$tonemap, transcode=$transcode, twoPass=$twoPass)';
}
