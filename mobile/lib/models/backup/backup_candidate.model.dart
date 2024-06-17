// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'package:photo_manager/photo_manager.dart';

class BackupCandidate {
  final String id;
  final List<String> albumName;
  final AssetEntity asset;

  BackupCandidate({
    required this.id,
    required this.albumName,
    required this.asset,
  });

  BackupCandidate copyWith({
    String? id,
    List<String>? albumName,
    AssetEntity? asset,
  }) {
    return BackupCandidate(
      id: id ?? this.id,
      albumName: albumName ?? this.albumName,
      asset: asset ?? this.asset,
    );
  }

  @override
  String toString() => 'BackupCandidate(albumName: $albumName, asset: $asset)';

  @override
  bool operator ==(covariant BackupCandidate other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.albumName == albumName &&
        other.asset == asset;
  }

  @override
  int get hashCode => id.hashCode ^ albumName.hashCode ^ asset.hashCode;
}
