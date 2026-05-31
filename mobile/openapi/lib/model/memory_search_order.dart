// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Sort order
enum MemorySearchOrder {
  asc._(r'asc'),
  desc._(r'desc'),
  random._(r'random'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const MemorySearchOrder._(this.value);

  final String value;

  static MemorySearchOrder? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
