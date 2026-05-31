// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Partner direction
enum PartnerDirection {
  sharedBy._(r'shared-by'),
  sharedWith._(r'shared-with'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const PartnerDirection._(this.value);

  final String value;

  static PartnerDirection? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
