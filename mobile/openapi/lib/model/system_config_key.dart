//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SystemConfigKey {
  /// Instantiate a new enum with the provided [value].
  const SystemConfigKey._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const crf = SystemConfigKey._(r'ffmpeg_crf');
  static const preset = SystemConfigKey._(r'ffmpeg_preset');
  static const targetVideoCodec = SystemConfigKey._(r'ffmpeg_target_video_codec');
  static const targetAudioCodec = SystemConfigKey._(r'ffmpeg_target_audio_codec');
  static const targetScaling = SystemConfigKey._(r'ffmpeg_target_scaling');

  /// List of all possible values in this [enum][SystemConfigKey].
  static const values = <SystemConfigKey>[
    crf,
    preset,
    targetVideoCodec,
    targetAudioCodec,
    targetScaling,
  ];

  static SystemConfigKey? fromJson(dynamic value) => SystemConfigKeyTypeTransformer().decode(value);

  static List<SystemConfigKey>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigKey>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigKey.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SystemConfigKey] to String,
/// and [decode] dynamic data back to [SystemConfigKey].
class SystemConfigKeyTypeTransformer {
  factory SystemConfigKeyTypeTransformer() => _instance ??= const SystemConfigKeyTypeTransformer._();

  const SystemConfigKeyTypeTransformer._();

  String encode(SystemConfigKey data) => data.value;

  /// Decodes a [dynamic value][data] to a SystemConfigKey.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SystemConfigKey? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'ffmpeg_crf': return SystemConfigKey.crf;
        case r'ffmpeg_preset': return SystemConfigKey.preset;
        case r'ffmpeg_target_video_codec': return SystemConfigKey.targetVideoCodec;
        case r'ffmpeg_target_audio_codec': return SystemConfigKey.targetAudioCodec;
        case r'ffmpeg_target_scaling': return SystemConfigKey.targetScaling;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SystemConfigKeyTypeTransformer] instance.
  static SystemConfigKeyTypeTransformer? _instance;
}

