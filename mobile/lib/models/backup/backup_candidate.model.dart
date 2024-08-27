import 'package:photo_manager/photo_manager.dart';

class BackupCandidate {
  BackupCandidate({required this.asset, required this.albumNames});

  AssetEntity asset;
  List<String> albumNames;

  @override
  int get hashCode => asset.hashCode;

  @override
  bool operator ==(Object other) {
    if (other is! BackupCandidate) {
      return false;
    }
    return asset == other.asset;
  }
}
