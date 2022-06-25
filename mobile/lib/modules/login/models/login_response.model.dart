import 'dart:convert';

class LogInReponse {
  final String accessToken;
  final String userId;
  final String userEmail;
  final String firstName;
  final String lastName;
  final String profileImagePath;
  final bool isAdmin;
  final bool isFirstLogin;

  LogInReponse({
    required this.accessToken,
    required this.userId,
    required this.userEmail,
    required this.firstName,
    required this.lastName,
    required this.profileImagePath,
    required this.isAdmin,
    required this.isFirstLogin,
  });

  LogInReponse copyWith({
    String? accessToken,
    String? userId,
    String? userEmail,
    String? firstName,
    String? lastName,
    String? profileImagePath,
    bool? isAdmin,
    bool? isFirstLogin,
  }) {
    return LogInReponse(
      accessToken: accessToken ?? this.accessToken,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      isAdmin: isAdmin ?? this.isAdmin,
      isFirstLogin: isFirstLogin ?? this.isFirstLogin,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'accessToken': accessToken});
    result.addAll({'userId': userId});
    result.addAll({'userEmail': userEmail});
    result.addAll({'firstName': firstName});
    result.addAll({'lastName': lastName});
    result.addAll({'profileImagePath': profileImagePath});
    result.addAll({'isAdmin': isAdmin});
    result.addAll({'isFirstLogin': isFirstLogin});

    return result;
  }

  factory LogInReponse.fromMap(Map<String, dynamic> map) {
    return LogInReponse(
      accessToken: map['accessToken'] ?? '',
      userId: map['userId'] ?? '',
      userEmail: map['userEmail'] ?? '',
      firstName: map['firstName'] ?? '',
      lastName: map['lastName'] ?? '',
      profileImagePath: map['profileImagePath'] ?? '',
      isAdmin: map['isAdmin'] ?? false,
      isFirstLogin: map['isFirstLogin'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory LogInReponse.fromJson(String source) =>
      LogInReponse.fromMap(json.decode(source));

  @override
  String toString() {
    return 'LogInReponse(accessToken: $accessToken, userId: $userId, userEmail: $userEmail, firstName: $firstName, lastName: $lastName, profileImagePath: $profileImagePath, isAdmin: $isAdmin, isFirstLogin: $isFirstLogin)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is LogInReponse &&
        other.accessToken == accessToken &&
        other.userId == userId &&
        other.userEmail == userEmail &&
        other.firstName == firstName &&
        other.lastName == lastName &&
        other.profileImagePath == profileImagePath &&
        other.isAdmin == isAdmin &&
        other.isFirstLogin == isFirstLogin;
  }

  @override
  int get hashCode {
    return accessToken.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        firstName.hashCode ^
        lastName.hashCode ^
        profileImagePath.hashCode ^
        isAdmin.hashCode ^
        isFirstLogin.hashCode;
  }
}
