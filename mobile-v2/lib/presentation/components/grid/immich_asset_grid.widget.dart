import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/presentation/components/grid/draggable_scrollbar.dart';
import 'package:immich_mobile/presentation/components/grid/immich_asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/utils/extensions/async_snapshot.extension.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:immich_mobile/utils/extensions/color.extension.dart';
import 'package:intl/intl.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

part 'immich_asset_grid_header.widget.dart';
part 'immich_grid_asset_placeholder.widget.dart';

class ImAssetGrid extends StatefulWidget {
  const ImAssetGrid({super.key});

  @override
  State createState() => _ImAssetGridState();
}

class _ImAssetGridState extends State<ImAssetGrid> {
  bool _isDragScrolling = false;
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

  void _onDragScrolling(bool isScrolling) {
    if (_isDragScrolling != isScrolling) {
      setState(() {
        _isDragScrolling = isScrolling;
      });
    }
  }

  Text? _labelBuilder(List<RenderListElement> elements, int currentPosition) {
    final element = elements.elementAtOrNull(currentPosition);
    if (element == null) {
      return null;
    }

    return Text(
      DateFormat.yMMMM().format(element.date),
      style: TextStyle(
        color: context.colorScheme.onSurface,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  @override
  Widget build(BuildContext context) =>
      BlocBuilder<ImmichAssetGridCubit, RenderList>(
        builder: (_, renderList) {
          final elements = renderList.elements;
          final grid = ScrollablePositionedList.builder(
            itemCount: elements.length,
            addAutomaticKeepAlives: false,
            minCacheExtent: 100,
            itemPositionsListener: _itemPositionsListener,
            itemScrollController: _itemScrollController,
            itemBuilder: (_, sectionIndex) {
              final section = elements[sectionIndex];

              return switch (section) {
                RenderListMonthHeaderElement() =>
                  _MonthHeader(text: section.header),
                RenderListDayHeaderElement() => Text(section.header),
                RenderListAssetElement() => FutureBuilder(
                    future: context.read<ImmichAssetGridCubit>().loadAssets(
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
                            child: asset == null || _isDragScrolling
                                ? const _ImImagePlaceholder()
                                : ImImage(asset),
                          );
                        },
                        itemCount: section.assetCount,
                      );
                    },
                  ),
              };
            },
          );
          return DraggableScrollbar(
            foregroundColor: context.colorScheme.onSurface,
            backgroundColor: context.colorScheme.surfaceContainerHighest,
            scrollStateListener: _onDragScrolling,
            itemPositionsListener: _itemPositionsListener,
            controller: _itemScrollController,
            labelTextBuilder: (int position) =>
                _labelBuilder(elements, position),
            labelConstraints: const BoxConstraints(maxHeight: 36),
            scrollbarAnimationDuration: const Duration(milliseconds: 300),
            scrollbarTimeToFade: const Duration(milliseconds: 1000),
            child: grid,
          );
        },
      );
}
