import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/extensions/async_snapshot.extension.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

part 'immich_asset_grid_header.widget.dart';

class ImAssetGrid extends StatelessWidget {
  const ImAssetGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: di<IAssetRepository>().getRenderList(),
      builder: (_, renderSnap) {
        final renderList = renderSnap.data;
        if (renderList == null) {
          return const SizedBox.shrink();
        }

        final elements = renderList.elements;
        return ScrollablePositionedList.builder(
          itemCount: elements.length,
          addAutomaticKeepAlives: false,
          minCacheExtent: 100,
          itemBuilder: (_, sectionIndex) {
            final section = elements[sectionIndex];

            return switch (section) {
              RenderListMonthHeaderElement() =>
                _MonthHeader(text: section.header),
              RenderListDayHeaderElement() => Text(section.header),
              RenderListAssetElement() => FutureBuilder(
                  future: renderList.loadAssets(
                    section.assetOffset,
                    section.assetCount,
                  ),
                  builder: (_, assetsSnap) {
                    final assets = assetsSnap.data;
                    return GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      addAutomaticKeepAlives: false,
                      cacheExtent: 100,
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                      ),
                      itemBuilder: (_, i) {
                        return SizedBox.square(
                          dimension: 200,
                          child: assetsSnap.isWaiting || assets == null
                              ? Container(color: Colors.grey)
                              // ignore: avoid-unsafe-collection-methods
                              : ImImage(assets[i]),
                        );
                      },
                      itemCount: section.assetCount,
                    );
                  },
                ),
            };
          },
        );
      },
    );
  }
}
