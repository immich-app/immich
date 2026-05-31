// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Face detection source type
enum SourceType {
  machineLearning._(r'machine-learning'),
  exif._(r'exif'),
  manual._(r'manual'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const SourceType._(this.value);

  final String value;

  static SourceType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
