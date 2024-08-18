// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'package:photo_manager/photo_manager.dart';

class BackupCandidate {
  final String id;
  final List<String> albumId;
  final AssetEntity asset;

  BackupCandidate({
    required this.id,
    required this.albumId,
    required this.asset,
  });

  BackupCandidate copyWith({
    String? id,
    List<String>? albumId,
    AssetEntity? asset,
  }) {
    return BackupCandidate(
      id: id ?? this.id,
      albumId: albumId ?? this.albumId,
      asset: asset ?? this.asset,
    );
  }

  @override
  String toString() => 'BackupCandidate(albumId: $albumId, asset: $asset)';

  @override
  bool operator ==(covariant BackupCandidate other) {
    if (identical(this, other)) return true;

    return other.id == id && other.albumId == albumId && other.asset == asset;
  }

  @override
  int get hashCode => id.hashCode ^ albumId.hashCode ^ asset.hashCode;
}
