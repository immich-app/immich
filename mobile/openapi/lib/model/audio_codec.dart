//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AudioCodec {
  /// Instantiate a new enum with the provided [value].
  const AudioCodec._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const mp3 = AudioCodec._(r'mp3');
  static const aac = AudioCodec._(r'aac');
  static const libopus = AudioCodec._(r'libopus');

  /// List of all possible values in this [enum][AudioCodec].
  static const values = <AudioCodec>[
    mp3,
    aac,
    libopus,
  ];

  static AudioCodec? fromJson(dynamic value) => AudioCodecTypeTransformer().decode(value);

  static List<AudioCodec> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AudioCodec>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AudioCodec.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AudioCodec] to String,
/// and [decode] dynamic data back to [AudioCodec].
class AudioCodecTypeTransformer {
  factory AudioCodecTypeTransformer() => _instance ??= const AudioCodecTypeTransformer._();

  const AudioCodecTypeTransformer._();

  String encode(AudioCodec data) => data.value;

  /// Decodes a [dynamic value][data] to a AudioCodec.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AudioCodec? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'mp3': return AudioCodec.mp3;
        case r'aac': return AudioCodec.aac;
        case r'libopus': return AudioCodec.libopus;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AudioCodecTypeTransformer] instance.
  static AudioCodecTypeTransformer? _instance;
}

