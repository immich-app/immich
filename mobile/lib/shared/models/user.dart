import 'package:openapi/api.dart';

class User {
  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.profileImagePath,
    required this.isAdmin,
    required this.oauthId,
  });

  User.fromDto(UserResponseDto dto)
      : id = dto.id,
        email = dto.email,
        firstName = dto.firstName,
        lastName = dto.lastName,
        profileImagePath = dto.profileImagePath,
        isAdmin = dto.isAdmin,
        oauthId = dto.oauthId;

  String id;
  String email;
  String firstName;
  String lastName;
  String profileImagePath;
  bool isAdmin;
  String oauthId;

  @override
  bool operator ==(other) {
    if (other is! User) return false;
    return id == other.id &&
        email == other.email &&
        firstName == other.firstName &&
        lastName == other.lastName &&
        profileImagePath == other.profileImagePath &&
        isAdmin == other.isAdmin &&
        oauthId == other.oauthId;
  }

  @override
  int get hashCode =>
      id.hashCode ^
      email.hashCode ^
      firstName.hashCode ^
      lastName.hashCode ^
      profileImagePath.hashCode ^
      isAdmin.hashCode ^
      oauthId.hashCode;

  UserResponseDto toDto() {
    return UserResponseDto(
      id: id,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImagePath: profileImagePath,
      createdAt: '',
      isAdmin: isAdmin,
      shouldChangePassword: false,
      oauthId: oauthId,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json["id"] = id;
    json["email"] = email;
    json["firstName"] = firstName;
    json["lastName"] = lastName;
    json["profileImagePath"] = profileImagePath;
    json["isAdmin"] = isAdmin;
    json["oauthId"] = oauthId;
    return json;
  }

  static User? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();
      return User(
        id: json["id"],
        email: json["email"],
        firstName: json["firstName"],
        lastName: json["lastName"],
        profileImagePath: json["profileImagePath"],
        isAdmin: json["isAdmin"],
        oauthId: json["oauthId"],
      );
    }
    return null;
  }
}
