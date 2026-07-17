//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigFFmpegRealtimeDto {
  /// Returns a new [SystemConfigFFmpegRealtimeDto] instance.
  SystemConfigFFmpegRealtimeDto({
    required this.enabled,
    this.resolutions = const [],
    this.videoCodecs = const [],
  });

  /// Enable real-time HLS transcoding (alpha)
  bool enabled;

  /// Resolutions to use for real-time HLS transcoding
  List<HlsVideoResolution> resolutions;

  /// Video codecs to use for real-time HLS transcoding
  List<VideoCodec> videoCodecs;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigFFmpegRealtimeDto &&
    other.enabled == enabled &&
    _deepEquality.equals(other.resolutions, resolutions) &&
    _deepEquality.equals(other.videoCodecs, videoCodecs);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (resolutions.hashCode) +
    (videoCodecs.hashCode);

  @override
  String toString() => 'SystemConfigFFmpegRealtimeDto[enabled=$enabled, resolutions=$resolutions, videoCodecs=$videoCodecs]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'resolutions'] = this.resolutions;
      json[r'videoCodecs'] = this.videoCodecs;
    return json;
  }

  /// Returns a new [SystemConfigFFmpegRealtimeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigFFmpegRealtimeDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigFFmpegRealtimeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigFFmpegRealtimeDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        resolutions: HlsVideoResolution.listFromJson(json[r'resolutions']),
        videoCodecs: VideoCodec.listFromJson(json[r'videoCodecs']),
      );
    }
    return null;
  }

  static List<SystemConfigFFmpegRealtimeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigFFmpegRealtimeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigFFmpegRealtimeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigFFmpegRealtimeDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigFFmpegRealtimeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigFFmpegRealtimeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigFFmpegRealtimeDto-objects as value to a dart map
  static Map<String, List<SystemConfigFFmpegRealtimeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigFFmpegRealtimeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigFFmpegRealtimeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'resolutions',
    'videoCodecs',
  };
}

