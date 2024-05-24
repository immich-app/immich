import 'package:flutter/foundation.dart';

@immutable
class LocalAlbum {
  final int id;
  final String localId;
  final String name;
  final DateTime modifiedTime;

  const LocalAlbum({
    required this.id,
    required this.localId,
    required this.name,
    required this.modifiedTime,
  });

  @override
  bool operator ==(covariant LocalAlbum other) {
    if (identical(this, other)) return true;

    return other.hashCode == hashCode;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        localId.hashCode ^
        name.hashCode ^
        modifiedTime.hashCode;
  }
}
