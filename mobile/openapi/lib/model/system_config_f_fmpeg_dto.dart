//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigFFmpegDto {
  /// Returns a new [SystemConfigFFmpegDto] instance.
  SystemConfigFFmpegDto({
    required this.accel,
    required this.crf,
    required this.maxBitrate,
    required this.preset,
    required this.targetAudioCodec,
    required this.targetResolution,
    required this.targetVideoCodec,
    required this.threads,
    required this.transcode,
    required this.twoPass,
  });

  TranscodeHWAccel accel;

  int crf;

  String maxBitrate;

  String preset;

  AudioCodec targetAudioCodec;

  String targetResolution;

  VideoCodec targetVideoCodec;

  int threads;

  TranscodePolicy transcode;

  bool twoPass;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigFFmpegDto &&
     other.accel == accel &&
     other.crf == crf &&
     other.maxBitrate == maxBitrate &&
     other.preset == preset &&
     other.targetAudioCodec == targetAudioCodec &&
     other.targetResolution == targetResolution &&
     other.targetVideoCodec == targetVideoCodec &&
     other.threads == threads &&
     other.transcode == transcode &&
     other.twoPass == twoPass;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accel.hashCode) +
    (crf.hashCode) +
    (maxBitrate.hashCode) +
    (preset.hashCode) +
    (targetAudioCodec.hashCode) +
    (targetResolution.hashCode) +
    (targetVideoCodec.hashCode) +
    (threads.hashCode) +
    (transcode.hashCode) +
    (twoPass.hashCode);

  @override
  String toString() => 'SystemConfigFFmpegDto[accel=$accel, crf=$crf, maxBitrate=$maxBitrate, preset=$preset, targetAudioCodec=$targetAudioCodec, targetResolution=$targetResolution, targetVideoCodec=$targetVideoCodec, threads=$threads, transcode=$transcode, twoPass=$twoPass]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accel'] = this.accel;
      json[r'crf'] = this.crf;
      json[r'maxBitrate'] = this.maxBitrate;
      json[r'preset'] = this.preset;
      json[r'targetAudioCodec'] = this.targetAudioCodec;
      json[r'targetResolution'] = this.targetResolution;
      json[r'targetVideoCodec'] = this.targetVideoCodec;
      json[r'threads'] = this.threads;
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

      return SystemConfigFFmpegDto(
        accel: TranscodeHWAccel.fromJson(json[r'accel'])!,
        crf: mapValueOfType<int>(json, r'crf')!,
        maxBitrate: mapValueOfType<String>(json, r'maxBitrate')!,
        preset: mapValueOfType<String>(json, r'preset')!,
        targetAudioCodec: AudioCodec.fromJson(json[r'targetAudioCodec'])!,
        targetResolution: mapValueOfType<String>(json, r'targetResolution')!,
        targetVideoCodec: VideoCodec.fromJson(json[r'targetVideoCodec'])!,
        threads: mapValueOfType<int>(json, r'threads')!,
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
    'crf',
    'maxBitrate',
    'preset',
    'targetAudioCodec',
    'targetResolution',
    'targetVideoCodec',
    'threads',
    'transcode',
    'twoPass',
  };
}

