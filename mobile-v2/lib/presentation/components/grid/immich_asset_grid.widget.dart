import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

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
          itemBuilder: (_, sectionIndex) {
            final section = elements[sectionIndex];

            return switch (section) {
              RenderListMonthHeaderElement() => Text(section.header),
              RenderListDayHeaderElement() => Text(section.header),
              RenderListAssetElement() => FutureBuilder(
                  future: renderList.loadAssets(
                    section.assetOffset,
                    section.assetCount,
                  ),
                  builder: (_, assetsSnap) {
                    final assets = assetsSnap.data;
                    if (assets == null) {
                      return const SizedBox.shrink();
                    }
                    return GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      shrinkWrap: true,
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                      ),
                      itemBuilder: (_, i) {
                        return SizedBox.square(
                          dimension: 200,
                          // ignore: avoid-unsafe-collection-methods
                          child: ImImage(assets.elementAt(i)),
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
