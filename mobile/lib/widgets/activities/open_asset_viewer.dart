import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';

Future<void> openActivityAssetViewer(BuildContext context, WidgetRef ref, String assetId) async {
  final asset = await ref.read(assetServiceProvider).getRemoteAsset(assetId);
  if (asset == null || !context.mounted) {
    return;
  }

  AssetViewer.setAsset(ref, asset);
  await context.pushRoute(
    AssetViewerRoute(
      initialIndex: 0,
      timelineService: ref.read(timelineFactoryProvider).fromAssets([asset], TimelineOrigin.albumActivities),
      currentAlbum: ref.read(currentRemoteAlbumProvider),
    ),
  );
}
