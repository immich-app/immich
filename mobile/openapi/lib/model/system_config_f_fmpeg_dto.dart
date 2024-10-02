//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigFFmpegDto {
  /// Returns a new [SystemConfigFFmpegDto] instance.
  SystemConfigFFmpegDto({
    required this.accel,
    required this.accelDecode,
    this.acceptedAudioCodecs = const [],
    this.acceptedContainers = const [],
    this.acceptedVideoCodecs = const [],
    required this.bframes,
    required this.cqMode,
    required this.crf,
    required this.gopSize,
    required this.maxBitrate,
    required this.npl,
    required this.preferredHwDevice,
    required this.preset,
    required this.refs,
    required this.targetAudioCodec,
    required this.targetResolution,
    required this.targetVideoCodec,
    required this.temporalAQ,
    required this.threads,
    required this.tonemap,
    required this.transcode,
    required this.twoPass,
  });

  TranscodeHWAccel accel;

  bool accelDecode;

  List<AudioCodec> acceptedAudioCodecs;

  List<VideoContainer> acceptedContainers;

  List<VideoCodec> acceptedVideoCodecs;

  /// Minimum value: -1
  /// Maximum value: 16
  int bframes;

  CQMode cqMode;

  /// Minimum value: 0
  /// Maximum value: 51
  int crf;

  /// Minimum value: 0
  int gopSize;

  String maxBitrate;

  /// Minimum value: 0
  int npl;

  String preferredHwDevice;

  String preset;

  /// Minimum value: 0
  /// Maximum value: 6
  int refs;

  AudioCodec targetAudioCodec;

  String targetResolution;

  VideoCodec targetVideoCodec;

  bool temporalAQ;

  /// Minimum value: 0
  int threads;

  ToneMapping tonemap;

  TranscodePolicy transcode;

  bool twoPass;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigFFmpegDto &&
    other.accel == accel &&
    other.accelDecode == accelDecode &&
    _deepEquality.equals(other.acceptedAudioCodecs, acceptedAudioCodecs) &&
    _deepEquality.equals(other.acceptedContainers, acceptedContainers) &&
    _deepEquality.equals(other.acceptedVideoCodecs, acceptedVideoCodecs) &&
    other.bframes == bframes &&
    other.cqMode == cqMode &&
    other.crf == crf &&
    other.gopSize == gopSize &&
    other.maxBitrate == maxBitrate &&
    other.npl == npl &&
    other.preferredHwDevice == preferredHwDevice &&
    other.preset == preset &&
    other.refs == refs &&
    other.targetAudioCodec == targetAudioCodec &&
    other.targetResolution == targetResolution &&
    other.targetVideoCodec == targetVideoCodec &&
    other.temporalAQ == temporalAQ &&
    other.threads == threads &&
    other.tonemap == tonemap &&
    other.transcode == transcode &&
    other.twoPass == twoPass;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accel.hashCode) +
    (accelDecode.hashCode) +
    (acceptedAudioCodecs.hashCode) +
    (acceptedContainers.hashCode) +
    (acceptedVideoCodecs.hashCode) +
    (bframes.hashCode) +
    (cqMode.hashCode) +
    (crf.hashCode) +
    (gopSize.hashCode) +
    (maxBitrate.hashCode) +
    (npl.hashCode) +
    (preferredHwDevice.hashCode) +
    (preset.hashCode) +
    (refs.hashCode) +
    (targetAudioCodec.hashCode) +
    (targetResolution.hashCode) +
    (targetVideoCodec.hashCode) +
    (temporalAQ.hashCode) +
    (threads.hashCode) +
    (tonemap.hashCode) +
    (transcode.hashCode) +
    (twoPass.hashCode);

  @override
  String toString() => 'SystemConfigFFmpegDto[accel=$accel, accelDecode=$accelDecode, acceptedAudioCodecs=$acceptedAudioCodecs, acceptedContainers=$acceptedContainers, acceptedVideoCodecs=$acceptedVideoCodecs, bframes=$bframes, cqMode=$cqMode, crf=$crf, gopSize=$gopSize, maxBitrate=$maxBitrate, npl=$npl, preferredHwDevice=$preferredHwDevice, preset=$preset, refs=$refs, targetAudioCodec=$targetAudioCodec, targetResolution=$targetResolution, targetVideoCodec=$targetVideoCodec, temporalAQ=$temporalAQ, threads=$threads, tonemap=$tonemap, transcode=$transcode, twoPass=$twoPass]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accel'] = this.accel;
      json[r'accelDecode'] = this.accelDecode;
      json[r'acceptedAudioCodecs'] = this.acceptedAudioCodecs;
      json[r'acceptedContainers'] = this.acceptedContainers;
      json[r'acceptedVideoCodecs'] = this.acceptedVideoCodecs;
      json[r'bframes'] = this.bframes;
      json[r'cqMode'] = this.cqMode;
      json[r'crf'] = this.crf;
      json[r'gopSize'] = this.gopSize;
      json[r'maxBitrate'] = this.maxBitrate;
      json[r'npl'] = this.npl;
      json[r'preferredHwDevice'] = this.preferredHwDevice;
      json[r'preset'] = this.preset;
      json[r'refs'] = this.refs;
      json[r'targetAudioCodec'] = this.targetAudioCodec;
      json[r'targetResolution'] = this.targetResolution;
      json[r'targetVideoCodec'] = this.targetVideoCodec;
      json[r'temporalAQ'] = this.temporalAQ;
      json[r'threads'] = this.threads;
      json[r'tonemap'] = this.tonemap;
      json[r'transcode'] = this.transcode;
      json[r'twoPass'] = this.twoPass;
    return json;
  }

  /// Returns a new [SystemConfigFFmpegDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigFFmpegDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigFFmpegDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigFFmpegDto(
        accel: TranscodeHWAccel.fromJson(json[r'accel'])!,
        accelDecode: mapValueOfType<bool>(json, r'accelDecode')!,
        acceptedAudioCodecs: AudioCodec.listFromJson(json[r'acceptedAudioCodecs']),
        acceptedContainers: VideoContainer.listFromJson(json[r'acceptedContainers']),
        acceptedVideoCodecs: VideoCodec.listFromJson(json[r'acceptedVideoCodecs']),
        bframes: mapValueOfType<int>(json, r'bframes')!,
        cqMode: CQMode.fromJson(json[r'cqMode'])!,
        crf: mapValueOfType<int>(json, r'crf')!,
        gopSize: mapValueOfType<int>(json, r'gopSize')!,
        maxBitrate: mapValueOfType<String>(json, r'maxBitrate')!,
        npl: mapValueOfType<int>(json, r'npl')!,
        preferredHwDevice: mapValueOfType<String>(json, r'preferredHwDevice')!,
        preset: mapValueOfType<String>(json, r'preset')!,
        refs: mapValueOfType<int>(json, r'refs')!,
        targetAudioCodec: AudioCodec.fromJson(json[r'targetAudioCodec'])!,
        targetResolution: mapValueOfType<String>(json, r'targetResolution')!,
        targetVideoCodec: VideoCodec.fromJson(json[r'targetVideoCodec'])!,
        temporalAQ: mapValueOfType<bool>(json, r'temporalAQ')!,
        threads: mapValueOfType<int>(json, r'threads')!,
        tonemap: ToneMapping.fromJson(json[r'tonemap'])!,
        transcode: TranscodePolicy.fromJson(json[r'transcode'])!,
        twoPass: mapValueOfType<bool>(json, r'twoPass')!,
      );
    }
    return null;
  }

  static List<SystemConfigFFmpegDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigFFmpegDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigFFmpegDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigFFmpegDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigFFmpegDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigFFmpegDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigFFmpegDto-objects as value to a dart map
  static Map<String, List<SystemConfigFFmpegDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigFFmpegDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigFFmpegDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'accel',
    'accelDecode',
    'acceptedAudioCodecs',
    'acceptedContainers',
    'acceptedVideoCodecs',
    'bframes',
    'cqMode',
    'crf',
    'gopSize',
    'maxBitrate',
    'npl',
    'preferredHwDevice',
    'preset',
    'refs',
    'targetAudioCodec',
    'targetResolution',
    'targetVideoCodec',
    'temporalAQ',
    'threads',
    'tonemap',
    'transcode',
    'twoPass',
  };
}

