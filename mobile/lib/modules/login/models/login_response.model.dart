import 'dart:convert';

class LogInReponse {
  final String accessToken;
  final String userId;
  final String userEmail;

  LogInReponse({
    required this.accessToken,
    required this.userId,
    required this.userEmail,
  });

  LogInReponse copyWith({
    String? accessToken,
    String? userId,
    String? userEmail,
  }) {
    return LogInReponse(
      accessToken: accessToken ?? this.accessToken,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'accessToken': accessToken,
      'userId': userId,
      'userEmail': userEmail,
    };
  }

  factory LogInReponse.fromMap(Map<String, dynamic> map) {
    return LogInReponse(
      accessToken: map['accessToken'] ?? '',
      userId: map['userId'] ?? '',
      userEmail: map['userEmail'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory LogInReponse.fromJson(String source) => LogInReponse.fromMap(json.decode(source));

  @override
  String toString() => 'LogInReponse(accessToken: $accessToken, userId: $userId, userEmail: $userEmail)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is LogInReponse &&
        other.accessToken == accessToken &&
        other.userId == userId &&
        other.userEmail == userEmail;
  }

  @override
  int get hashCode => accessToken.hashCode ^ userId.hashCode ^ userEmail.hashCode;
}
