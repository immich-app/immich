//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncUserV1 {
  /// Returns a new [SyncUserV1] instance.
  SyncUserV1({
    this.avatarColor,
    required this.deletedAt,
    required this.email,
    required this.hasProfileImage,
    required this.id,
    required this.name,
    required this.profileChangedAt,
  });

  UserAvatarColor? avatarColor;

  /// User deleted at
  DateTime? deletedAt;

  /// User email
  String email;

  /// User has profile image
  bool hasProfileImage;

  /// User ID
  String id;

  /// User name
  String name;

  /// User profile changed at
  DateTime profileChangedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncUserV1 &&
    other.avatarColor == avatarColor &&
    other.deletedAt == deletedAt &&
    other.email == email &&
    other.hasProfileImage == hasProfileImage &&
    other.id == id &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor == null ? 0 : avatarColor!.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (hasProfileImage.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode);

  @override
  String toString() => 'SyncUserV1[avatarColor=$avatarColor, deletedAt=$deletedAt, email=$email, hasProfileImage=$hasProfileImage, id=$id, name=$name, profileChangedAt=$profileChangedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.avatarColor != null) {
      json[r'avatarColor'] = this.avatarColor;
    } else {
    //  json[r'avatarColor'] = null;
    }
    if (this.deletedAt != null) {
      json[r'deletedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.deletedAt!.millisecondsSinceEpoch
        : this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'email'] = this.email;
      json[r'hasProfileImage'] = this.hasProfileImage;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.profileChangedAt.millisecondsSinceEpoch
        : this.profileChangedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [SyncUserV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncUserV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncUserV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncUserV1(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor']),
        deletedAt: mapDateTime(json, r'deletedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        email: mapValueOfType<String>(json, r'email')!,
        hasProfileImage: mapValueOfType<bool>(json, r'hasProfileImage')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
      );
    }
    return null;
  }

  static List<SyncUserV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncUserV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncUserV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncUserV1> mapFromJson(dynamic json) {
    final map = <String, SyncUserV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncUserV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncUserV1-objects as value to a dart map
  static Map<String, List<SyncUserV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncUserV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncUserV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deletedAt',
    'email',
    'hasProfileImage',
    'id',
    'name',
    'profileChangedAt',
  };
}

