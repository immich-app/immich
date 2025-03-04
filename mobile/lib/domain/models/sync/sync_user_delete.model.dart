// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

class SyncUserDeleteResponse {
  final String userId;
  SyncUserDeleteResponse({
    required this.userId,
  });

  SyncUserDeleteResponse copyWith({
    String? userId,
  }) {
    return SyncUserDeleteResponse(
      userId: userId ?? this.userId,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'userId': userId,
    };
  }

  factory SyncUserDeleteResponse.fromMap(Map<String, dynamic> map) {
    return SyncUserDeleteResponse(
      userId: map['userId'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory SyncUserDeleteResponse.fromJson(String source) =>
      SyncUserDeleteResponse.fromMap(
        json.decode(source) as Map<String, dynamic>,
      );

  @override
  String toString() => 'SyncUserDeleteResponse(userId: $userId)';

  @override
  bool operator ==(covariant SyncUserDeleteResponse other) {
    if (identical(this, other)) return true;

    return other.userId == userId;
  }

  @override
  int get hashCode => userId.hashCode;
}
