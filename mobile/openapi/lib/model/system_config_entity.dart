//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigEntity {
  /// Returns a new [SystemConfigEntity] instance.
  SystemConfigEntity({
    required this.key,
    required this.value,
  });

  SystemConfigEntityKeyEnum key;

  Object value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigEntity &&
     other.key == key &&
     other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (key.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'SystemConfigEntity[key=$key, value=$value]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'key'] = key;
      _json[r'value'] = value;
    return _json;
  }

  /// Returns a new [SystemConfigEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigEntity[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigEntity[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigEntity(
        key: SystemConfigEntityKeyEnum.fromJson(json[r'key'])!,
        value: mapValueOfType<Object>(json, r'value')!,
      );
    }
    return null;
  }

  static List<SystemConfigEntity>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigEntity> mapFromJson(dynamic json) {
    final map = <String, SystemConfigEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigEntity-objects as value to a dart map
  static Map<String, List<SystemConfigEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigEntity>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigEntity.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'key',
    'value',
  };
}


class SystemConfigEntityKeyEnum {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigEntityKeyEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const crf = SystemConfigEntityKeyEnum._(r'ffmpeg_crf');
  static const preset = SystemConfigEntityKeyEnum._(r'ffmpeg_preset');
  static const targetVideoCodec = SystemConfigEntityKeyEnum._(r'ffmpeg_target_video_codec');
  static const targetAudioCodec = SystemConfigEntityKeyEnum._(r'ffmpeg_target_audio_codec');
  static const targetScaling = SystemConfigEntityKeyEnum._(r'ffmpeg_target_scaling');

  /// List of all possible values in this [enum][SystemConfigEntityKeyEnum].
  static const values = <SystemConfigEntityKeyEnum>[
    crf,
    preset,
    targetVideoCodec,
    targetAudioCodec,
    targetScaling,
  ];

  static SystemConfigEntityKeyEnum? fromJson(dynamic value) => SystemConfigEntityKeyEnumTypeTransformer().decode(value);

  static List<SystemConfigEntityKeyEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigEntityKeyEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigEntityKeyEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigEntityKeyEnum] to String,
/// and [decode] dynamic data back to [SystemConfigEntityKeyEnum].
class SystemConfigEntityKeyEnumTypeTransformer {
  factory SystemConfigEntityKeyEnumTypeTransformer() => _instance ??= const SystemConfigEntityKeyEnumTypeTransformer._();

  const SystemConfigEntityKeyEnumTypeTransformer._();

  String encode(SystemConfigEntityKeyEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigEntityKeyEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigEntityKeyEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'ffmpeg_crf': return SystemConfigEntityKeyEnum.crf;
        case r'ffmpeg_preset': return SystemConfigEntityKeyEnum.preset;
        case r'ffmpeg_target_video_codec': return SystemConfigEntityKeyEnum.targetVideoCodec;
        case r'ffmpeg_target_audio_codec': return SystemConfigEntityKeyEnum.targetAudioCodec;
        case r'ffmpeg_target_scaling': return SystemConfigEntityKeyEnum.targetScaling;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigEntityKeyEnumTypeTransformer] instance.
  static SystemConfigEntityKeyEnumTypeTransformer? _instance;
}


