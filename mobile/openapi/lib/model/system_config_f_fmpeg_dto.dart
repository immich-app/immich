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
    required this.preset,
    required this.targetVideoCodec,
    required this.targetAudioCodec,
    required this.targetResolution,
    required this.transcode,
  });

  String crf;

  String preset;

  String targetVideoCodec;

  String targetAudioCodec;

  String targetResolution;

  SystemConfigFFmpegDtoTranscodeEnum transcode;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigFFmpegDto &&
     other.crf == crf &&
     other.preset == preset &&
     other.targetVideoCodec == targetVideoCodec &&
     other.targetAudioCodec == targetAudioCodec &&
     other.targetResolution == targetResolution &&
     other.transcode == transcode;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (crf.hashCode) +
    (preset.hashCode) +
    (targetVideoCodec.hashCode) +
    (targetAudioCodec.hashCode) +
    (targetResolution.hashCode) +
    (transcode.hashCode);

  @override
  String toString() => 'SystemConfigFFmpegDto[crf=$crf, preset=$preset, targetVideoCodec=$targetVideoCodec, targetAudioCodec=$targetAudioCodec, targetResolution=$targetResolution, transcode=$transcode]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'crf'] = this.crf;
      json[r'preset'] = this.preset;
      json[r'targetVideoCodec'] = this.targetVideoCodec;
      json[r'targetAudioCodec'] = this.targetAudioCodec;
      json[r'targetResolution'] = this.targetResolution;
      json[r'transcode'] = this.transcode;
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
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigFFmpegDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigFFmpegDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigFFmpegDto(
        crf: mapValueOfType<String>(json, r'crf')!,
        preset: mapValueOfType<String>(json, r'preset')!,
        targetVideoCodec: mapValueOfType<String>(json, r'targetVideoCodec')!,
        targetAudioCodec: mapValueOfType<String>(json, r'targetAudioCodec')!,
        targetResolution: mapValueOfType<String>(json, r'targetResolution')!,
        transcode: SystemConfigFFmpegDtoTranscodeEnum.fromJson(json[r'transcode'])!,
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
    'preset',
    'targetVideoCodec',
    'targetAudioCodec',
    'targetResolution',
    'transcode',
  };
}


class SystemConfigFFmpegDtoTranscodeEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigFFmpegDtoTranscodeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const all = SystemConfigFFmpegDtoTranscodeEnum._(r'all');
  static const optimal = SystemConfigFFmpegDtoTranscodeEnum._(r'optimal');
  static const required_ = SystemConfigFFmpegDtoTranscodeEnum._(r'required');
  static const disabled = SystemConfigFFmpegDtoTranscodeEnum._(r'disabled');

  /// List of all possible values in this [enum][SystemConfigFFmpegDtoTranscodeEnum].
  static const values = <SystemConfigFFmpegDtoTranscodeEnum>[
    all,
    optimal,
    required_,
    disabled,
  ];

  static SystemConfigFFmpegDtoTranscodeEnum? fromJson(dynamic value) => SystemConfigFFmpegDtoTranscodeEnumTypeTransformer().decode(value);

  static List<SystemConfigFFmpegDtoTranscodeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigFFmpegDtoTranscodeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigFFmpegDtoTranscodeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigFFmpegDtoTranscodeEnum] to String,
/// and [decode] dynamic data back to [SystemConfigFFmpegDtoTranscodeEnum].
class SystemConfigFFmpegDtoTranscodeEnumTypeTransformer {
  factory SystemConfigFFmpegDtoTranscodeEnumTypeTransformer() => _instance ??= const SystemConfigFFmpegDtoTranscodeEnumTypeTransformer._();

  const SystemConfigFFmpegDtoTranscodeEnumTypeTransformer._();

  String encode(SystemConfigFFmpegDtoTranscodeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigFFmpegDtoTranscodeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigFFmpegDtoTranscodeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'all': return SystemConfigFFmpegDtoTranscodeEnum.all;
        case r'optimal': return SystemConfigFFmpegDtoTranscodeEnum.optimal;
        case r'required': return SystemConfigFFmpegDtoTranscodeEnum.required_;
        case r'disabled': return SystemConfigFFmpegDtoTranscodeEnum.disabled;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigFFmpegDtoTranscodeEnumTypeTransformer] instance.
  static SystemConfigFFmpegDtoTranscodeEnumTypeTransformer? _instance;
}


