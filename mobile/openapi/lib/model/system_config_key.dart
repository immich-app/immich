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

  static const ffmpegCrf = SystemConfigKey._(r'ffmpeg_crf');
  static const ffmpegPreset = SystemConfigKey._(r'ffmpeg_preset');
  static const ffmpegTargetVideoCodec = SystemConfigKey._(r'ffmpeg_target_video_codec');
  static const ffmpegTargetAudioCodec = SystemConfigKey._(r'ffmpeg_target_audio_codec');
  static const ffmpegTargetScaling = SystemConfigKey._(r'ffmpeg_target_scaling');
  static const OAUTH_ENABLED = SystemConfigKey._(r'OAUTH_ENABLED');
  static const OAUTH_AUTO_REGISTER = SystemConfigKey._(r'OAUTH_AUTO_REGISTER');
  static const OAUTH_ISSUER_URL = SystemConfigKey._(r'OAUTH_ISSUER_URL');
  static const OAUTH_SCOPE = SystemConfigKey._(r'OAUTH_SCOPE');
  static const OAUTH_BUTTON_TEXT = SystemConfigKey._(r'OAUTH_BUTTON_TEXT');
  static const OAUTH_CLIENT_ID = SystemConfigKey._(r'OAUTH_CLIENT_ID');
  static const OAUTH_CLIENT_SECRET = SystemConfigKey._(r'OAUTH_CLIENT_SECRET');

  /// List of all possible values in this [enum][SystemConfigKey].
  static const values = <SystemConfigKey>[
    ffmpegCrf,
    ffmpegPreset,
    ffmpegTargetVideoCodec,
    ffmpegTargetAudioCodec,
    ffmpegTargetScaling,
    OAUTH_ENABLED,
    OAUTH_AUTO_REGISTER,
    OAUTH_ISSUER_URL,
    OAUTH_SCOPE,
    OAUTH_BUTTON_TEXT,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
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
        case r'ffmpeg_crf': return SystemConfigKey.ffmpegCrf;
        case r'ffmpeg_preset': return SystemConfigKey.ffmpegPreset;
        case r'ffmpeg_target_video_codec': return SystemConfigKey.ffmpegTargetVideoCodec;
        case r'ffmpeg_target_audio_codec': return SystemConfigKey.ffmpegTargetAudioCodec;
        case r'ffmpeg_target_scaling': return SystemConfigKey.ffmpegTargetScaling;
        case r'OAUTH_ENABLED': return SystemConfigKey.OAUTH_ENABLED;
        case r'OAUTH_AUTO_REGISTER': return SystemConfigKey.OAUTH_AUTO_REGISTER;
        case r'OAUTH_ISSUER_URL': return SystemConfigKey.OAUTH_ISSUER_URL;
        case r'OAUTH_SCOPE': return SystemConfigKey.OAUTH_SCOPE;
        case r'OAUTH_BUTTON_TEXT': return SystemConfigKey.OAUTH_BUTTON_TEXT;
        case r'OAUTH_CLIENT_ID': return SystemConfigKey.OAUTH_CLIENT_ID;
        case r'OAUTH_CLIENT_SECRET': return SystemConfigKey.OAUTH_CLIENT_SECRET;
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

