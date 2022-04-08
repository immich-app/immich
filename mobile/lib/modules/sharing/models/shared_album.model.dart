import 'dart:convert';

import 'package:collection/collection.dart';

import 'package:immich_mobile/modules/sharing/models/shared_user.model.dart';

class SharedAlbum {
  final String id;
  final String ownerId;
  final String albumName;
  final String createdAt;
  final List<SharedUsers> sharedUsers;

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
    String? createdAt,
    List<SharedUsers>? sharedUsers,
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
    result.addAll({'createdAt': createdAt});
    result.addAll({'sharedUsers': sharedUsers.map((x) => x.toMap()).toList()});

    return result;
  }

  factory SharedAlbum.fromMap(Map<String, dynamic> map) {
    return SharedAlbum(
      id: map['id'] ?? '',
      ownerId: map['ownerId'] ?? '',
      albumName: map['albumName'] ?? '',
      createdAt: map['createdAt'] ?? '',
      sharedUsers: List<SharedUsers>.from(map['sharedUsers']?.map((x) => SharedUsers.fromMap(x))),
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
    final listEquals = const DeepCollectionEquality().equals;

    return other is SharedAlbum &&
        other.id == id &&
        other.ownerId == ownerId &&
        other.albumName == albumName &&
        other.createdAt == createdAt &&
        listEquals(other.sharedUsers, sharedUsers);
  }

  @override
  int get hashCode {
    return id.hashCode ^ ownerId.hashCode ^ albumName.hashCode ^ createdAt.hashCode ^ sharedUsers.hashCode;
  }
}
