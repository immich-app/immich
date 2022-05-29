import 'dart:convert';

class UploadProfileImageResponse {
  final String userId;
  final String profileImagePath;
  UploadProfileImageResponse({
    required this.userId,
    required this.profileImagePath,
  });

  UploadProfileImageResponse copyWith({
    String? userId,
    String? profileImagePath,
  }) {
    return UploadProfileImageResponse(
      userId: userId ?? this.userId,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'userId': userId});
    result.addAll({'profileImagePath': profileImagePath});

    return result;
  }

  factory UploadProfileImageResponse.fromMap(Map<String, dynamic> map) {
    return UploadProfileImageResponse(
      userId: map['userId'] ?? '',
      profileImagePath: map['profileImagePath'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory UploadProfileImageResponse.fromJson(String source) => UploadProfileImageResponse.fromMap(json.decode(source));

  @override
  String toString() => 'UploadProfileImageReponse(userId: $userId, profileImagePath: $profileImagePath)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is UploadProfileImageResponse && other.userId == userId && other.profileImagePath == profileImagePath;
  }

  @override
  int get hashCode => userId.hashCode ^ profileImagePath.hashCode;
}
