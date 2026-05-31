// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// User metadata key
enum UserMetadataKey {
  preferences._(r'preferences'),
  license._(r'license'),
  onboarding._(r'onboarding'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const UserMetadataKey._(this.value);

  final String value;

  static UserMetadataKey? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
