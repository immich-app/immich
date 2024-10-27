import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_list_view/flutter_list_view.dart';
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

part 'asset_grid_header.widget.dart';

class ImAssetGrid extends StatefulWidget {
  /// The padding for the grid
  final double? topPadding;

  final FlutterListViewController? controller;

  const ImAssetGrid({this.controller, this.topPadding, super.key});

  @override
  State createState() => _ImAssetGridState();
}

class _ImAssetGridState extends State<ImAssetGrid> {
  late final FlutterListViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? FlutterListViewController();
  }

  @override
  void dispose() {
    // Dispose controller if it was created here
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
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

          final grid = FlutterListView(
            delegate: FlutterListViewDelegate(
              (_, sectionIndex) {
                // ignore: avoid-unsafe-collection-methods
                final section = elements[sectionIndex];

                return switch (section) {
                  RenderListPaddingElement() => Padding(
                      padding: EdgeInsets.only(top: section.topPadding),
                    ),
                  RenderListMonthHeaderElement() =>
                    _MonthHeader(text: section.header),
                  RenderListDayHeaderElement() => Text(section.header),
                  RenderListAssetElement() => ImStaticGrid(
                      section: section,
                      isDragging: state.isDragScrolling,
                    ),
                };
              },
              childCount: elements.length,
              addAutomaticKeepAlives: false,
            ),
            controller: _controller,
          );

          final EdgeInsetsGeometry? padding;
          if (widget.topPadding == null) {
            padding = null;
          } else {
            padding = EdgeInsets.only(top: widget.topPadding!);
          }

          return DraggableScrollbar(
            controller: _controller,
            maxItemCount: elements.length,
            scrollStateListener:
                context.read<AssetGridCubit>().setDragScrolling,
            backgroundColor: context.colorScheme.surfaceContainerHighest,
            foregroundColor: context.colorScheme.onSurface,
            padding: padding,
            scrollbarAnimationDuration: Durations.medium2,
            scrollbarTimeToFade: Durations.extralong4,
            labelTextBuilder: (int position) =>
                _labelBuilder(elements, position),
            labelConstraints: const BoxConstraints(maxHeight: 36),
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
