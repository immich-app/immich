import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/render_list.model.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/page_empty.widget.dart';
import 'package:immich_mobile/presentation/components/grid/asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/grid/asset_render_grid.widget.dart';
import 'package:immich_mobile/presentation/components/grid/draggable_scrollbar.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_thumbnail.widget.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/async_snapshot.extension.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:immich_mobile/utils/extensions/color.extension.dart';
import 'package:intl/intl.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

part 'asset_grid_header.widget.dart';

class ImmichAssetGridView extends StatefulWidget {
  const ImmichAssetGridView({super.key});

  @override
  createState() {
    return ImmichAssetGridViewState();
  }
}

class ImmichAssetGridViewState extends State<ImmichAssetGridView> {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ScrollOffsetController _scrollOffsetController =
      ScrollOffsetController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();
  bool _scrolling = false;

  Widget _itemBuilder(BuildContext c, int position) {
    int index = position;

    return BlocSelector<AssetGridCubit, AssetGridState, RenderList>(
      selector: (state) => state.renderList,
      builder: (_, renderList) {
        final section = renderList.elements.elementAtOrNull(index);

        if (renderList.totalCount == 0 || section == null) {
          return const _ImGridEmpty();
        }

        return _Section(sectionIndex: index);
      }, // no.of elements are not equal or is modified
    );
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

  Widget _buildAssetGrid() {
    final useDragScrolling = true;

    // ignore: avoid-local-functions
    void dragScrolling(bool active) {
      if (active != _scrolling) {
        setState(() {
          _scrolling = active;
        });
      }
    }

    // ignore: avoid-local-functions
    bool appBarOffset() => true;

    return BlocSelector<AssetGridCubit, AssetGridState, RenderList>(
      selector: (state) => state.renderList,
      builder: (_, renderList) {
        final listWidget = ScrollablePositionedList.builder(
          itemCount: renderList.elements.length,
          itemBuilder: _itemBuilder,
          itemScrollController: _itemScrollController,
          itemPositionsListener: _itemPositionsListener,
          scrollOffsetController: _scrollOffsetController,
          padding: EdgeInsets.only(top: appBarOffset() ? 60 : 0, bottom: 220),
          addRepaintBoundaries: true,
        );

        return (useDragScrolling && ModalRoute.of(context) != null)
            ? DraggableScrollbar.semicircle(
                controller: _itemScrollController,
                itemPositionsListener: _itemPositionsListener,
                scrollStateListener: dragScrolling,
                backgroundColor: context.colorScheme.surfaceContainerHighest,
                foregroundColor: context.colorScheme.onSurface,
                padding: appBarOffset()
                    ? const EdgeInsets.only(top: 120)
                    : const EdgeInsets.only(),
                heightOffset: appBarOffset() ? 60 : 0,
                scrollbarAnimationDuration: const Duration(milliseconds: 300),
                scrollbarTimeToFade: const Duration(milliseconds: 1000),
                labelTextBuilder: (pos) =>
                    _labelBuilder(renderList.elements, pos),
                labelConstraints: const BoxConstraints(maxHeight: 28),
                child: listWidget,
              )
            : listWidget;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return _buildAssetGrid();
  }
}

/// A single row of all placeholder widgets
class _PlaceholderRow extends StatelessWidget {
  final int number;
  final double width;
  final double height;

  const _PlaceholderRow({
    super.key,
    required this.number,
    required this.width,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (int i = 0; i < 4; i++)
          ImImagePlaceholder(
            key: ValueKey(i),
            width: width,
            height: height,
            margin: 1,
          ),
      ],
    );
  }
}

/// A section for the render grid
class _Section extends StatelessWidget {
  final int sectionIndex;

  const _Section({required this.sectionIndex});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AssetGridCubit, AssetGridState>(
      builder: (_, state) => LayoutBuilder(
        builder: (_, constraints) {
          // ignore: avoid-unsafe-collection-methods
          final section = state.renderList.elements[sectionIndex];

          if (section is RenderListMonthHeaderElement) {
            return _MonthHeader(text: section.header);
          }

          if (section is RenderListDayHeaderElement) {
            return Text(section.header);
          }

          if (section is! RenderListAssetElement) {
            return const SizedBox();
          }

          final scrolling = state.isDragScrolling;
          final assetsPerRow = 4;
          final margin = 1.0;

          final width = constraints.maxWidth / 4 - (4 - 1) * margin / 4;
          final rows = (section.assetCount + 4 - 1) ~/ 4;
          final Future<List<Asset>> assetsToRender = scrolling
              ? Future.value([])
              : context
                  .read<AssetGridCubit>()
                  .loadAssets(section.assetCount, section.assetCount);
          return FutureBuilder(
            future: assetsToRender,
            builder: (_, snap) => Column(
              key: ValueKey(section.assetCount),
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (int i = 0; i < rows; i++)
                  scrolling || snap.isWaiting
                      ? _PlaceholderRow(
                          key: ValueKey(i),
                          number: assetsPerRow,
                          width: width - 1.5,
                          height: width,
                        )
                      : _AssetRow(
                          key: ValueKey(i),
                          assets: snap.data!.nestedSlice(
                            i * assetsPerRow,
                            min((i + 1) * assetsPerRow, section.assetCount),
                          ),
                          width: width,
                          margin: margin,
                          assetsPerRow: assetsPerRow,
                        ),
              ],
            ),
          );
        },
      ),
      // no.of elements are not equal or is modified
      buildWhen: (previous, current) =>
          (previous.renderList.elements.length !=
              current.renderList.elements.length) ||
          !previous.renderList.modifiedTime
              .isAtSameMomentAs(current.renderList.modifiedTime),
    );
  }
}

/// The row of assets
class _AssetRow extends StatelessWidget {
  final List<Asset> assets;
  final double width;
  final double margin;
  final int assetsPerRow;

  const _AssetRow({
    super.key,
    required this.assets,
    required this.width,
    required this.margin,
    required this.assetsPerRow,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      key: key,
      children: assets.mapIndexed((int index, Asset asset) {
        final bool last = index + 1 == assetsPerRow;
        return Container(
          width: width,
          height: width,
          margin: EdgeInsets.only(right: last ? 0.0 : margin, bottom: margin),
          child: ImThumbnail(asset),
        );
      }).toList(),
    );
  }
}

class ImAssetGrid extends StatefulWidget {
  /// The padding for the grid
  final double? topPadding;

  const ImAssetGrid({this.topPadding, super.key});

  @override
  State createState() => _ImAssetGridState();
}

class _ImAssetGridState extends State<ImAssetGrid> {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ScrollOffsetController _scrollOffsetController =
      ScrollOffsetController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

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
      BlocBuilder<AssetGridCubit, AssetGridState>(
        builder: (_, state) {
          final elements = state.renderList.elements;

          if (state.renderList.totalCount == 0) {
            return const _ImGridEmpty();
          }

          // Append padding if required
          if (widget.topPadding != null &&
              elements.firstOrNull is! RenderListPaddingElement) {
            elements.insert(
              0,
              RenderListPaddingElement.beforeElement(
                top: widget.topPadding!,
                before: elements.firstOrNull,
              ),
            );
          } else if (widget.topPadding == null &&
              elements.firstOrNull is RenderListPaddingElement) {
            elements.removeAt(0);
          }

          final EdgeInsets? padding = null;

          final grid = ScrollablePositionedList.builder(
            itemCount: state.renderList.elements.length,
            itemBuilder: (_, sectionIndex) {
              // ignore: avoid-unsafe-collection-methods
              final section = elements[sectionIndex];

              return switch (section) {
                RenderListPaddingElement() => Padding(
                    padding: EdgeInsets.only(top: section.topPadding),
                  ),
                RenderListMonthHeaderElement() =>
                  _MonthHeader(text: section.header),
                RenderListDayHeaderElement() => Text(section.header),
                RenderListAssetElement() => ImStaticGrid(section: section),
              };
            },
            itemScrollController: _itemScrollController,
            itemPositionsListener: _itemPositionsListener,
            scrollOffsetController: _scrollOffsetController,
            padding: padding,
            addRepaintBoundaries: true,
          );

          return DraggableScrollbar.semicircle(
            alwaysVisibleScrollThumb: true,
            controller: _itemScrollController,
            itemPositionsListener: _itemPositionsListener,
            scrollStateListener:
                context.read<AssetGridCubit>().setDragScrolling,
            backgroundColor: context.colorScheme.surfaceContainerHighest,
            foregroundColor: context.colorScheme.onSurface,
            padding: EdgeInsets.only(top: 120),
            heightOffset: 100,
            scrollbarAnimationDuration: const Duration(milliseconds: 300),
            scrollbarTimeToFade: const Duration(milliseconds: 1000),
            labelTextBuilder: (int position) =>
                _labelBuilder(elements, position),
            labelConstraints: const BoxConstraints(maxHeight: 28),
            child: grid,
          );
        },
        // no.of elements are not equal or is modified
        buildWhen: (previous, current) =>
            (previous.renderList.elements.length !=
                current.renderList.elements.length) ||
            !previous.renderList.modifiedTime
                .isAtSameMomentAs(current.renderList.modifiedTime),
      );
}

class _ImGridEmpty extends StatelessWidget {
  const _ImGridEmpty();

  @override
  Widget build(BuildContext context) {
    return ImPageEmptyIndicator(
      icon: Symbols.photo_camera_rounded,
      subtitle: SizedBox(
        width: context.width * RatioConstants.twoThird,
        child: Text(
          context.t.common.components.grid_empty_message,
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

extension ListExtension<E> on List<E> {
  List<E> uniqueConsecutive({
    int Function(E a, E b)? compare,
    void Function(E a, E b)? onDuplicate,
  }) {
    compare ??= (E a, E b) => a == b ? 0 : 1;
    int i = 1, j = 1;
    for (; i < length; i++) {
      if (compare(this[i - 1], this[i]) != 0) {
        if (i != j) {
          this[j] = this[i];
        }
        j++;
      } else if (onDuplicate != null) {
        onDuplicate(this[i - 1], this[i]);
      }
    }
    length = length == 0 ? 0 : j;
    return this;
  }

  ListSlice<E> nestedSlice(int start, int end) {
    if (this is ListSlice) {
      final ListSlice<E> self = this as ListSlice<E>;
      return ListSlice<E>(self.source, self.start + start, self.start + end);
    }
    return ListSlice<E>(this, start, end);
  }
}
