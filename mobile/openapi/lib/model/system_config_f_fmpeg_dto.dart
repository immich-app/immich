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
    required this.crf,
    required this.threads,
    required this.targetVideoCodec,
    required this.targetAudioCodec,
    required this.transcode,
    required this.preset,
    required this.targetResolution,
    required this.maxBitrate,
    required this.twoPass,
  });

  int crf;

  int threads;

  VideoCodec targetVideoCodec;

  AudioCodec targetAudioCodec;

  TranscodePolicy transcode;

  String preset;

  String targetResolution;

  String maxBitrate;

  bool twoPass;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigFFmpegDto &&
     other.crf == crf &&
     other.threads == threads &&
     other.targetVideoCodec == targetVideoCodec &&
     other.targetAudioCodec == targetAudioCodec &&
     other.transcode == transcode &&
     other.preset == preset &&
     other.targetResolution == targetResolution &&
     other.maxBitrate == maxBitrate &&
     other.twoPass == twoPass;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (crf.hashCode) +
    (threads.hashCode) +
    (targetVideoCodec.hashCode) +
    (targetAudioCodec.hashCode) +
    (transcode.hashCode) +
    (preset.hashCode) +
    (targetResolution.hashCode) +
    (maxBitrate.hashCode) +
    (twoPass.hashCode);

  @override
  String toString() => 'SystemConfigFFmpegDto[crf=$crf, threads=$threads, targetVideoCodec=$targetVideoCodec, targetAudioCodec=$targetAudioCodec, transcode=$transcode, preset=$preset, targetResolution=$targetResolution, maxBitrate=$maxBitrate, twoPass=$twoPass]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'crf'] = this.crf;
      json[r'threads'] = this.threads;
      json[r'targetVideoCodec'] = this.targetVideoCodec;
      json[r'targetAudioCodec'] = this.targetAudioCodec;
      json[r'transcode'] = this.transcode;
      json[r'preset'] = this.preset;
      json[r'targetResolution'] = this.targetResolution;
      json[r'maxBitrate'] = this.maxBitrate;
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
        crf: mapValueOfType<int>(json, r'crf')!,
        threads: mapValueOfType<int>(json, r'threads')!,
        targetVideoCodec: VideoCodec.fromJson(json[r'targetVideoCodec'])!,
        targetAudioCodec: AudioCodec.fromJson(json[r'targetAudioCodec'])!,
        transcode: TranscodePolicy.fromJson(json[r'transcode'])!,
        preset: mapValueOfType<String>(json, r'preset')!,
        targetResolution: mapValueOfType<String>(json, r'targetResolution')!,
        maxBitrate: mapValueOfType<String>(json, r'maxBitrate')!,
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
    'crf',
    'threads',
    'targetVideoCodec',
    'targetAudioCodec',
    'transcode',
    'preset',
    'targetResolution',
    'maxBitrate',
    'twoPass',
  };
}

