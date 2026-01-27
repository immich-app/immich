import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class RemoteDeletedLocalAsset {
  final LocalAsset asset;
  final DateTime remoteDeletedAt;

  const RemoteDeletedLocalAsset({required this.asset, required this.remoteDeletedAt});
}
