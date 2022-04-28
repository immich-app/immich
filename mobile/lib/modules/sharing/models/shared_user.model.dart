import 'dart:convert';

import 'package:immich_mobile/shared/models/user_info.model.dart';

class SharedUsers {
  final int id;
  final String albumId;
  final String sharedUserId;
  final UserInfo userInfo;

  SharedUsers({
    required this.id,
    required this.albumId,
    required this.sharedUserId,
    required this.userInfo,
  });

  SharedUsers copyWith({
    int? id,
    String? albumId,
    String? sharedUserId,
    UserInfo? userInfo,
  }) {
    return SharedUsers(
      id: id ?? this.id,
      albumId: albumId ?? this.albumId,
      sharedUserId: sharedUserId ?? this.sharedUserId,
      userInfo: userInfo ?? this.userInfo,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'albumId': albumId});
    result.addAll({'sharedUserId': sharedUserId});
    result.addAll({'userInfo': userInfo.toMap()});

    return result;
  }

  factory SharedUsers.fromMap(Map<String, dynamic> map) {
    return SharedUsers(
      id: map['id']?.toInt() ?? 0,
      albumId: map['albumId'] ?? '',
      sharedUserId: map['sharedUserId'] ?? '',
      userInfo: UserInfo.fromMap(map['userInfo']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SharedUsers.fromJson(String source) => SharedUsers.fromMap(json.decode(source));

  @override
  String toString() {
    return 'SharedUsers(id: $id, albumId: $albumId, sharedUserId: $sharedUserId, userInfo: $userInfo)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SharedUsers &&
        other.id == id &&
        other.albumId == albumId &&
        other.sharedUserId == sharedUserId &&
        other.userInfo == userInfo;
  }

  @override
  int get hashCode {
    return id.hashCode ^ albumId.hashCode ^ sharedUserId.hashCode ^ userInfo.hashCode;
  }
}
