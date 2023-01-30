import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/models/image_viewer_page_state.model.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/remote_photo_view.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

// ignore: must_be_immutable
class ImageViewerPage extends HookConsumerWidget {
  final String heroTag;
  final Asset asset;
  final String authToken;
  final bool loadPreview;
  final bool loadOriginal;

  ImageViewerPage({
    Key? key,
    required this.heroTag,
    required this.asset,
    required this.authToken,
    required this.loadPreview,
    required this.loadOriginal,
  }) : super(key: key);

  Asset? assetDetail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isZoomed = useState<bool>(false);
    final forbidZoom = useState<bool>(true);
    final localPosition = useState<Offset>(const Offset(0,0));
    final downloadAssetStatus =
        ref.watch(imageViewerStateProvider).downloadAssetStatus;

    getAssetExif() async {
      if (asset.isRemote) {
        assetDetail =
            await ref.watch(assetServiceProvider).getAssetById(asset.id);
      } else {
        // TODO local exif parsing?
        assetDetail = asset;
      }
    }

    useEffect(
      () {
        getAssetExif();
        return null;
      },
      [],
    );

    void showInfo() {
      if (asset.isLocal) {
        showModalBottomSheet(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15.0),
          ),
          barrierColor: Colors.transparent,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          context: context,
          builder: (context) {
            return ExifBottomSheet(assetDetail: assetDetail!);
          },
        );
      }
    }

    void handleSwipeUpDown( details) {
      int sensitivity = 15;
      int dxThreshhold = 50;

      if (isZoomed.value) {
        return;
      }

      // Check for delta from initial down point
      final d = details.localPosition - localPosition.value;
      // If the magnitude of the dx swipe is large, we probably didn't mean to go down
      if (d.dx.abs() > dxThreshhold) {
        return;
      }

      if (details.delta.dy > sensitivity) {
        AutoRouter.of(context).pop();
      } else if (details.delta.dy < -sensitivity) {
        showInfo();
      }
    }

    return Scaffold(
      body: Stack(
        children: [
          Center(
            child: Hero(
              tag: heroTag,
              child: IgnorePointer(
                ignoring: forbidZoom.value,
                child: GestureDetector(
                  onVerticalDragStart: (down) => localPosition.value = down.localPosition,
                  onVerticalDragUpdate: handleSwipeUpDown,
                  onSecondaryTapDown: (_) => isZoomed.value = true,
                  onSecondaryTapUp: (_) => isZoomed.value = false,
                  child: InteractiveViewer(
                    minScale: 1.0,
                    child: RemotePhotoView(
                        asset: asset,
                        authToken: authToken,
                        loadPreview: loadPreview,
                        loadOriginal: loadOriginal,
                      ),
                    ),
                  ),
              ),
            ),
          ),
          if (downloadAssetStatus == DownloadAssetStatus.loading)
            const Center(
              child: ImmichLoadingIndicator(),
            ),
        ],
      ),
    );
  }
}
