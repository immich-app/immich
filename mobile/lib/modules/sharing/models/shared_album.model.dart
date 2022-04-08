import 'dart:convert';

import 'package:immich_mobile/shared/models/user_info.model.dart';

class SharedUsers {
  final String sharedUserId;
  final UserInfo userInfo;

  SharedUsers({
    required this.sharedUserId,
    required this.userInfo,
  });

  SharedUsers copyWith({
    String? sharedUserId,
    UserInfo? userInfo,
  }) {
    return SharedUsers(
      sharedUserId: sharedUserId ?? this.sharedUserId,
      userInfo: userInfo ?? this.userInfo,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'sharedUserId': sharedUserId});
    result.addAll({'userInfo': userInfo.toMap()});

    return result;
  }

  factory SharedUsers.fromMap(Map<String, dynamic> map) {
    return SharedUsers(
      sharedUserId: map['sharedUserId'] ?? '',
      userInfo: UserInfo.fromMap(map['userInfo']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SharedUsers.fromJson(String source) => SharedUsers.fromMap(json.decode(source));

  @override
  String toString() => 'SharedUsers(sharedUserId: $sharedUserId, userInfo: $userInfo)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SharedUsers && other.sharedUserId == sharedUserId && other.userInfo == userInfo;
  }

  @override
  int get hashCode => sharedUserId.hashCode ^ userInfo.hashCode;
}

class SharedAlbum {
  final String id;
  final String ownerId;
  final String albumName;
  final DateTime createdAt;
  final SharedUsers sharedUsers;

  SharedAlbum({
    required this.id,
    required this.ownerId,
    required this.albumName,
    required this.createdAt,
    required this.sharedUsers,
  });

  SharedAlbum copyWith({
    String? id,
    String? ownerId,
    String? albumName,
    DateTime? createdAt,
    SharedUsers? sharedUsers,
  }) {
    return SharedAlbum(
      id: id ?? this.id,
      ownerId: ownerId ?? this.ownerId,
      albumName: albumName ?? this.albumName,
      createdAt: createdAt ?? this.createdAt,
      sharedUsers: sharedUsers ?? this.sharedUsers,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'ownerId': ownerId});
    result.addAll({'albumName': albumName});
    result.addAll({'createdAt': createdAt.millisecondsSinceEpoch});
    result.addAll({'sharedUsers': sharedUsers.toMap()});

    return result;
  }

  factory SharedAlbum.fromMap(Map<String, dynamic> map) {
    return SharedAlbum(
      id: map['id'] ?? '',
      ownerId: map['ownerId'] ?? '',
      albumName: map['albumName'] ?? '',
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt']),
      sharedUsers: SharedUsers.fromMap(map['sharedUsers']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SharedAlbum.fromJson(String source) => SharedAlbum.fromMap(json.decode(source));

  @override
  String toString() {
    return 'SharedAlbum(id: $id, ownerId: $ownerId, albumName: $albumName, createdAt: $createdAt, sharedUsers: $sharedUsers)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SharedAlbum &&
        other.id == id &&
        other.ownerId == ownerId &&
        other.albumName == albumName &&
        other.createdAt == createdAt &&
        other.sharedUsers == sharedUsers;
  }

  @override
  int get hashCode {
    return id.hashCode ^ ownerId.hashCode ^ albumName.hashCode ^ createdAt.hashCode ^ sharedUsers.hashCode;
  }
}
