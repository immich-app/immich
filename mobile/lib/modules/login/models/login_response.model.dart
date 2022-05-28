import 'dart:convert';

class LogInReponse {
  final String accessToken;
  final String userId;
  final String userEmail;
  final String firstName;
  final String lastName;
  final bool isAdmin;
  LogInReponse({
    required this.accessToken,
    required this.userId,
    required this.userEmail,
    required this.firstName,
    required this.lastName,
    required this.isAdmin,
  });

  LogInReponse copyWith({
    String? accessToken,
    String? userId,
    String? userEmail,
    String? firstName,
    String? lastName,
    bool? isAdmin,
  }) {
    return LogInReponse(
      accessToken: accessToken ?? this.accessToken,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      isAdmin: isAdmin ?? this.isAdmin,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'accessToken': accessToken});
    result.addAll({'userId': userId});
    result.addAll({'userEmail': userEmail});
    result.addAll({'firstName': firstName});
    result.addAll({'lastName': lastName});
    result.addAll({'isAdmin': isAdmin});

    return result;
  }

  factory LogInReponse.fromMap(Map<String, dynamic> map) {
    return LogInReponse(
      accessToken: map['accessToken'] ?? '',
      userId: map['userId'] ?? '',
      userEmail: map['userEmail'] ?? '',
      firstName: map['firstName'] ?? '',
      lastName: map['lastName'] ?? '',
      isAdmin: map['isAdmin'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory LogInReponse.fromJson(String source) => LogInReponse.fromMap(json.decode(source));

  @override
  String toString() {
    return 'LogInReponse(accessToken: $accessToken, userId: $userId, userEmail: $userEmail, firstName: $firstName, lastName: $lastName, isAdmin: $isAdmin)';
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
        other.isAdmin == isAdmin;
  }

  @override
  int get hashCode {
    return accessToken.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        firstName.hashCode ^
        lastName.hashCode ^
        isAdmin.hashCode;
  }
}
