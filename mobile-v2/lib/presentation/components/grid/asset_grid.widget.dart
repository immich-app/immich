import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/page_empty.widget.dart';
import 'package:immich_mobile/presentation/components/grid/asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/grid/asset_render_grid.widget.dart';
import 'package:immich_mobile/presentation/components/grid/draggable_scrollbar.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:immich_mobile/utils/extensions/color.extension.dart';
import 'package:intl/intl.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

part 'asset_grid_header.widget.dart';

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
