part of 'immich_asset_grid.widget.dart';

class _StaticGrid extends StatelessWidget {
  final RenderListAssetElement section;
  final bool isDragging;

  const _StaticGrid({required this.section, required this.isDragging});

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
