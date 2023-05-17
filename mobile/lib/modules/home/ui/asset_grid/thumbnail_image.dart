import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/storage_indicator.dart';

class ThumbnailImage extends HookConsumerWidget {
  final Asset asset;
  final List<Asset> assetList;
  final bool showStorageIndicator;
  final bool useGrayBoxPlaceholder;
  final bool isSelected;
  final bool multiselectEnabled;
  final Function? onSelect;
  final Function? onDeselect;

  const ThumbnailImage({
    Key? key,
    required this.asset,
    required this.assetList,
    this.showStorageIndicator = true,
    this.useGrayBoxPlaceholder = false,
    this.isSelected = false,
    this.multiselectEnabled = false,
    this.onDeselect,
    this.onSelect,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget buildSelectionIcon(Asset asset) {
      if (isSelected) {
        return Icon(
          Icons.check_circle,
          color: Theme.of(context).primaryColor,
        );
      } else {
        return const Icon(
          Icons.circle_outlined,
          color: Colors.white,
        );
      }
    }

    return GestureDetector(
      onTap: () {
        if (multiselectEnabled) {
          if (isSelected) {
            onDeselect?.call();
          } else {
            onSelect?.call();
          }
        } else {
          AutoRouter.of(context).push(
            GalleryViewerRoute(
              assetList: assetList,
              asset: asset,
            ),
          );
        }
      },
      onLongPress: () {
        onSelect?.call();
        HapticFeedback.heavyImpact();
      },
      child: Hero(
        createRectTween: (begin, end) {
          double? top;
          // Uses the [BoxFit.contain] algorithm
          if (asset.width != null && asset.height != null) {
            final assetAR = asset.width! / asset.height!;
            final w = MediaQuery.of(context).size.width;
            final deviceAR = MediaQuery.of(context).size.aspectRatio;
            if (deviceAR < assetAR) {
              top = asset.height! * w / asset.width!;
            } else {
              top = 0;
            }
            // get the height offset
          }

          return MaterialRectCenterArcTween(
            begin: Rect.fromLTRB(
              0,
              top ?? 0.0,
              MediaQuery.of(context).size.width,
              MediaQuery.of(context).size.height,
            ),
            end: end,
          );
        },
        tag: asset.id,
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                border: multiselectEnabled && isSelected
                    ? Border.all(
                        color: Theme.of(context).primaryColorLight,
                        width: 10,
                      )
                    : const Border(),
              ),
              child: ImmichImage(
                asset,
                width: 300,
                height: 300,
                useGrayBoxPlaceholder: useGrayBoxPlaceholder,
              ),
            ),
            if (multiselectEnabled)
              Padding(
                padding: const EdgeInsets.all(3.0),
                child: Align(
                  alignment: Alignment.topLeft,
                  child: buildSelectionIcon(asset),
                ),
              ),
            if (showStorageIndicator)
              Positioned(
                right: 10,
                bottom: 5,
                child: Icon(
                  storageIcon(asset),
                  color: Colors.white,
                  size: 18,
                ),
              ),
            if (ref.watch(favoriteProvider).contains(asset.id))
              const Positioned(
                left: 10,
                bottom: 5,
                child: Icon(
                  Icons.favorite,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            if (!asset.isImage)
              Positioned(
                top: 5,
                right: 5,
                child: Row(
                  children: [
                    Text(
                      asset.duration.toString().substring(0, 7),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                    const Icon(
                      Icons.play_circle_outline_rounded,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
