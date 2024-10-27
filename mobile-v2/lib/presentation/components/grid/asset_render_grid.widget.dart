import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/presentation/components/grid/asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_thumbnail.widget.dart';
import 'package:immich_mobile/utils/extensions/async_snapshot.extension.dart';

class ImStaticGrid extends StatelessWidget {
  final RenderListAssetElement section;
  final bool isDragging;

  const ImStaticGrid({
    super.key,
    required this.section,
    required this.isDragging,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: context.read<AssetGridCubit>().loadAssets(
            section.assetOffset,
            section.assetCount,
          ),
      builder: (_, assetsSnap) {
        final assets = assetsSnap.data;
        return GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          padding: const EdgeInsets.all(0),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 3,
            crossAxisSpacing: 3,
          ),
          itemBuilder: (_, i) {
            final asset = assetsSnap.isWaiting || assets == null
                ? null
                : assets.elementAtOrNull(i);
            return SizedBox.square(
              dimension: 200,
              // Show Placeholder when drag scrolled
              child: asset == null || isDragging
                  ? const ImImagePlaceholder()
                  : ImThumbnail(asset),
            );
          },
          itemCount: section.assetCount,
          addAutomaticKeepAlives: false,
          cacheExtent: 100,
        );
      },
    );
  }
}
