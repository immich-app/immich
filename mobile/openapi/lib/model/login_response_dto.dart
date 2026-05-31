// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class LoginResponseDto {
  const LoginResponseDto({
    required this.accessToken,
    required this.isAdmin,
    required this.isOnboarded,
    required this.name,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.userEmail,
    required this.userId,
  });

  /// Access token
  final String accessToken;

  /// Is admin user
  final bool isAdmin;

  /// Is onboarded
  final bool isOnboarded;

  /// User name
  final String name;

  /// Profile image path
  final String profileImagePath;

  /// Should change password
  final bool shouldChangePassword;

  /// User email
  final String userEmail;

  /// User ID
  final String userId;

  static LoginResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<LoginResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      accessToken: json[r'accessToken'] as String,
      isAdmin: json[r'isAdmin'] as bool,
      isOnboarded: json[r'isOnboarded'] as bool,
      name: json[r'name'] as String,
      profileImagePath: json[r'profileImagePath'] as String,
      shouldChangePassword: json[r'shouldChangePassword'] as bool,
      userEmail: json[r'userEmail'] as String,
      userId: json[r'userId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'accessToken'] = accessToken;
    json[r'isAdmin'] = isAdmin;
    json[r'isOnboarded'] = isOnboarded;
    json[r'name'] = name;
    json[r'profileImagePath'] = profileImagePath;
    json[r'shouldChangePassword'] = shouldChangePassword;
    json[r'userEmail'] = userEmail;
    json[r'userId'] = userId;
    return json;
  }

  LoginResponseDto copyWith({
    String? accessToken,
    bool? isAdmin,
    bool? isOnboarded,
    String? name,
    String? profileImagePath,
    bool? shouldChangePassword,
    String? userEmail,
    String? userId,
  }) {
    return .new(
      accessToken: accessToken ?? this.accessToken,
      isAdmin: isAdmin ?? this.isAdmin,
      isOnboarded: isOnboarded ?? this.isOnboarded,
      name: name ?? this.name,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      shouldChangePassword: shouldChangePassword ?? this.shouldChangePassword,
      userEmail: userEmail ?? this.userEmail,
      userId: userId ?? this.userId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is LoginResponseDto &&
            accessToken == other.accessToken &&
            isAdmin == other.isAdmin &&
            isOnboarded == other.isOnboarded &&
            name == other.name &&
            profileImagePath == other.profileImagePath &&
            shouldChangePassword == other.shouldChangePassword &&
            userEmail == other.userEmail &&
            userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      accessToken,
      isAdmin,
      isOnboarded,
      name,
      profileImagePath,
      shouldChangePassword,
      userEmail,
      userId,
    ]);
  }

  @override
  String toString() =>
      'LoginResponseDto(accessToken=$accessToken, isAdmin=$isAdmin, isOnboarded=$isOnboarded, name=$name, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, userEmail=$userEmail, userId=$userId)';
}
