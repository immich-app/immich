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
    required this.preferredHwDevice,
    required this.preset,
    required this.realtime,
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

  /// Accelerated decode
  bool accelDecode;

  /// Accepted audio codecs
  List<AudioCodec> acceptedAudioCodecs;

  /// Accepted containers
  List<VideoContainer> acceptedContainers;

  /// Accepted video codecs
  List<VideoCodec> acceptedVideoCodecs;

  /// B-frames
  ///
  /// Minimum value: -1
  /// Maximum value: 16
  int bframes;

  CQMode cqMode;

  /// CRF
  ///
  /// Minimum value: 0
  /// Maximum value: 51
  int crf;

  /// GOP size
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int gopSize;

  /// Max bitrate
  String maxBitrate;

  /// Preferred hardware device
  String preferredHwDevice;

  /// Preset
  String preset;

  SystemConfigFFmpegRealtimeDto realtime;

  /// References
  ///
  /// Minimum value: 0
  /// Maximum value: 6
  int refs;

  AudioCodec targetAudioCodec;

  /// Target resolution
  String targetResolution;

  VideoCodec targetVideoCodec;

  /// Temporal AQ
  bool temporalAQ;

  /// Threads
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int threads;

  ToneMapping tonemap;

  TranscodePolicy transcode;

  /// Two pass
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
    other.preferredHwDevice == preferredHwDevice &&
    other.preset == preset &&
    other.realtime == realtime &&
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
    (preferredHwDevice.hashCode) +
    (preset.hashCode) +
    (realtime.hashCode) +
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
  String toString() => 'SystemConfigFFmpegDto[accel=$accel, accelDecode=$accelDecode, acceptedAudioCodecs=$acceptedAudioCodecs, acceptedContainers=$acceptedContainers, acceptedVideoCodecs=$acceptedVideoCodecs, bframes=$bframes, cqMode=$cqMode, crf=$crf, gopSize=$gopSize, maxBitrate=$maxBitrate, preferredHwDevice=$preferredHwDevice, preset=$preset, realtime=$realtime, refs=$refs, targetAudioCodec=$targetAudioCodec, targetResolution=$targetResolution, targetVideoCodec=$targetVideoCodec, temporalAQ=$temporalAQ, threads=$threads, tonemap=$tonemap, transcode=$transcode, twoPass=$twoPass]';

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
      json[r'preferredHwDevice'] = this.preferredHwDevice;
      json[r'preset'] = this.preset;
      json[r'realtime'] = this.realtime;
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
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'accel'), 'Required key "SystemConfigFFmpegDto[accel]" is missing from JSON.');
        assert(json[r'accel'] != null, 'Required key "SystemConfigFFmpegDto[accel]" has a null value in JSON.');
        assert(json.containsKey(r'accelDecode'), 'Required key "SystemConfigFFmpegDto[accelDecode]" is missing from JSON.');
        assert(json[r'accelDecode'] != null, 'Required key "SystemConfigFFmpegDto[accelDecode]" has a null value in JSON.');
        assert(json.containsKey(r'acceptedAudioCodecs'), 'Required key "SystemConfigFFmpegDto[acceptedAudioCodecs]" is missing from JSON.');
        assert(json[r'acceptedAudioCodecs'] != null, 'Required key "SystemConfigFFmpegDto[acceptedAudioCodecs]" has a null value in JSON.');
        assert(json.containsKey(r'acceptedContainers'), 'Required key "SystemConfigFFmpegDto[acceptedContainers]" is missing from JSON.');
        assert(json[r'acceptedContainers'] != null, 'Required key "SystemConfigFFmpegDto[acceptedContainers]" has a null value in JSON.');
        assert(json.containsKey(r'acceptedVideoCodecs'), 'Required key "SystemConfigFFmpegDto[acceptedVideoCodecs]" is missing from JSON.');
        assert(json[r'acceptedVideoCodecs'] != null, 'Required key "SystemConfigFFmpegDto[acceptedVideoCodecs]" has a null value in JSON.');
        assert(json.containsKey(r'bframes'), 'Required key "SystemConfigFFmpegDto[bframes]" is missing from JSON.');
        assert(json[r'bframes'] != null, 'Required key "SystemConfigFFmpegDto[bframes]" has a null value in JSON.');
        assert(json.containsKey(r'cqMode'), 'Required key "SystemConfigFFmpegDto[cqMode]" is missing from JSON.');
        assert(json[r'cqMode'] != null, 'Required key "SystemConfigFFmpegDto[cqMode]" has a null value in JSON.');
        assert(json.containsKey(r'crf'), 'Required key "SystemConfigFFmpegDto[crf]" is missing from JSON.');
        assert(json[r'crf'] != null, 'Required key "SystemConfigFFmpegDto[crf]" has a null value in JSON.');
        assert(json.containsKey(r'gopSize'), 'Required key "SystemConfigFFmpegDto[gopSize]" is missing from JSON.');
        assert(json[r'gopSize'] != null, 'Required key "SystemConfigFFmpegDto[gopSize]" has a null value in JSON.');
        assert(json.containsKey(r'maxBitrate'), 'Required key "SystemConfigFFmpegDto[maxBitrate]" is missing from JSON.');
        assert(json[r'maxBitrate'] != null, 'Required key "SystemConfigFFmpegDto[maxBitrate]" has a null value in JSON.');
        assert(json.containsKey(r'preferredHwDevice'), 'Required key "SystemConfigFFmpegDto[preferredHwDevice]" is missing from JSON.');
        assert(json[r'preferredHwDevice'] != null, 'Required key "SystemConfigFFmpegDto[preferredHwDevice]" has a null value in JSON.');
        assert(json.containsKey(r'preset'), 'Required key "SystemConfigFFmpegDto[preset]" is missing from JSON.');
        assert(json[r'preset'] != null, 'Required key "SystemConfigFFmpegDto[preset]" has a null value in JSON.');
        assert(json.containsKey(r'realtime'), 'Required key "SystemConfigFFmpegDto[realtime]" is missing from JSON.');
        assert(json[r'realtime'] != null, 'Required key "SystemConfigFFmpegDto[realtime]" has a null value in JSON.');
        assert(json.containsKey(r'refs'), 'Required key "SystemConfigFFmpegDto[refs]" is missing from JSON.');
        assert(json[r'refs'] != null, 'Required key "SystemConfigFFmpegDto[refs]" has a null value in JSON.');
        assert(json.containsKey(r'targetAudioCodec'), 'Required key "SystemConfigFFmpegDto[targetAudioCodec]" is missing from JSON.');
        assert(json[r'targetAudioCodec'] != null, 'Required key "SystemConfigFFmpegDto[targetAudioCodec]" has a null value in JSON.');
        assert(json.containsKey(r'targetResolution'), 'Required key "SystemConfigFFmpegDto[targetResolution]" is missing from JSON.');
        assert(json[r'targetResolution'] != null, 'Required key "SystemConfigFFmpegDto[targetResolution]" has a null value in JSON.');
        assert(json.containsKey(r'targetVideoCodec'), 'Required key "SystemConfigFFmpegDto[targetVideoCodec]" is missing from JSON.');
        assert(json[r'targetVideoCodec'] != null, 'Required key "SystemConfigFFmpegDto[targetVideoCodec]" has a null value in JSON.');
        assert(json.containsKey(r'temporalAQ'), 'Required key "SystemConfigFFmpegDto[temporalAQ]" is missing from JSON.');
        assert(json[r'temporalAQ'] != null, 'Required key "SystemConfigFFmpegDto[temporalAQ]" has a null value in JSON.');
        assert(json.containsKey(r'threads'), 'Required key "SystemConfigFFmpegDto[threads]" is missing from JSON.');
        assert(json[r'threads'] != null, 'Required key "SystemConfigFFmpegDto[threads]" has a null value in JSON.');
        assert(json.containsKey(r'tonemap'), 'Required key "SystemConfigFFmpegDto[tonemap]" is missing from JSON.');
        assert(json[r'tonemap'] != null, 'Required key "SystemConfigFFmpegDto[tonemap]" has a null value in JSON.');
        assert(json.containsKey(r'transcode'), 'Required key "SystemConfigFFmpegDto[transcode]" is missing from JSON.');
        assert(json[r'transcode'] != null, 'Required key "SystemConfigFFmpegDto[transcode]" has a null value in JSON.');
        assert(json.containsKey(r'twoPass'), 'Required key "SystemConfigFFmpegDto[twoPass]" is missing from JSON.');
        assert(json[r'twoPass'] != null, 'Required key "SystemConfigFFmpegDto[twoPass]" has a null value in JSON.');
        return true;
      }());

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
        preferredHwDevice: mapValueOfType<String>(json, r'preferredHwDevice')!,
        preset: mapValueOfType<String>(json, r'preset')!,
        realtime: SystemConfigFFmpegRealtimeDto.fromJson(json[r'realtime'])!,
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
    'preferredHwDevice',
    'preset',
    'realtime',
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

