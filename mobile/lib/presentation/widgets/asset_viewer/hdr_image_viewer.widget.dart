import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/images/hdr_image_view.dart';
import 'package:immich_mobile/services/api.service.dart';

class HDRImageViewer extends StatelessWidget {
  final BaseAsset asset;
  final Widget image;

  const HDRImageViewer({
    super.key,
    required this.asset,
    required this.image,
  });

  bool get _shouldUseLocalAsset =>
      asset.hasLocal &&
      (!asset.hasRemote || !AppSetting.get(Setting.preferRemoteImage)) &&
      !asset.isEdited;

  @override
  Widget build(BuildContext context) {
    final String? localAssetId;
    final String? remoteUrl;
    final Map<String, String>? headers;

    if (_shouldUseLocalAsset) {
      localAssetId = asset is LocalAsset ? (asset as LocalAsset).id : (asset as RemoteAsset).localId;
      remoteUrl = null;
      headers = null;
    } else {
      localAssetId = null;
      final String assetId;
      if (asset is LocalAsset && asset.hasRemote) {
        assetId = (asset as LocalAsset).remoteId!;
      } else if (asset is RemoteAsset) {
        assetId = (asset as RemoteAsset).id;
      } else {
        return image;
      }
      remoteUrl = '${Store.get(StoreKey.serverEndpoint)}/assets/$assetId/original';
      headers = ApiService.getRequestHeaders();
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Center(key: ValueKey(asset.heroTag), child: image),
        IgnorePointer(
          child: HDRImageView(
            localAssetId: localAssetId,
            remoteUrl: remoteUrl,
            headers: headers,
          ),
        ),
      ],
    );
  }
}
