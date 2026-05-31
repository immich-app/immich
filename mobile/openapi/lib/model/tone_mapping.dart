// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Tone mapping
enum ToneMapping {
  hable._(r'hable'),
  mobius._(r'mobius'),
  reinhard._(r'reinhard'),
  disabled._(r'disabled'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const ToneMapping._(this.value);

  final String value;

  static ToneMapping? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
