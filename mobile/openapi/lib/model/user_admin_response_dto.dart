//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserAdminResponseDto {
  /// Returns a new [UserAdminResponseDto] instance.
  UserAdminResponseDto({
    required this.id,
    required this.name,
    required this.email,
    required this.shouldChangePassword,
    required this.isAdmin,
    required this.createdAt,
    required this.deletedAt,
    required this.updatedAt,
    required this.status,
  });

  /// User ID
  String id;

  /// User name
  String name;

  /// User email
  String email;

  /// Require password change on next login
  bool shouldChangePassword;

  /// Is admin user
  bool isAdmin;

  /// Creation date
  DateTime createdAt;

  /// Deletion date
  DateTime? deletedAt;

  /// Last update date
  DateTime updatedAt;

  /// User status
  UserStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserAdminResponseDto &&
    other.id == id &&
    other.name == name &&
    other.email == email &&
    other.shouldChangePassword == shouldChangePassword &&
    other.isAdmin == isAdmin &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    other.updatedAt == updatedAt &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode) +
    (email.hashCode) +
    (shouldChangePassword.hashCode) +
    (isAdmin.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (updatedAt.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'UserAdminResponseDto[id=$id, name=$name, email=$email, shouldChangePassword=$shouldChangePassword, isAdmin=$isAdmin, createdAt=$createdAt, deletedAt=$deletedAt, updatedAt=$updatedAt, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'email'] = this.email;
      json[r'shouldChangePassword'] = this.shouldChangePassword;
      json[r'isAdmin'] = this.isAdmin;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [UserAdminResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserAdminResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "UserAdminResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserAdminResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        email: mapValueOfType<String>(json, r'email')!,
        shouldChangePassword: mapValueOfType<bool>(json, r'shouldChangePassword')!,
        isAdmin: mapValueOfType<bool>(json, r'isAdmin')!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        status: UserStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<UserAdminResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserAdminResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserAdminResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserAdminResponseDto> mapFromJson(dynamic json) {
    final map = <String, UserAdminResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserAdminResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserAdminResponseDto-objects as value to a dart map
  static Map<String, List<UserAdminResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserAdminResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserAdminResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'email',
    'shouldChangePassword',
    'isAdmin',
    'createdAt',
    'deletedAt',
    'updatedAt',
    'status',
  };
}

