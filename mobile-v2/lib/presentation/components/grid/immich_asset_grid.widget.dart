import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_list_view/flutter_list_view.dart';
import 'package:immich_mobile/domain/models/render_list_element.model.dart';
import 'package:immich_mobile/presentation/components/grid/draggable_scrollbar.dart';
import 'package:immich_mobile/presentation/components/grid/immich_asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_thumbnail.widget.dart';
import 'package:immich_mobile/utils/extensions/async_snapshot.extension.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:intl/intl.dart';
import 'package:material_symbols_icons/symbols.dart';

part 'immich_asset_grid_header.widget.dart';

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
          if (widget.topPadding != null &&
              elements.firstOrNull is! RenderListPaddingElement) {
            elements.insert(
              0,
              RenderListPaddingElement.beforeElement(
                top: widget.topPadding!,
                before: elements.firstOrNull,
              ),
            );
          }

          final grid = FlutterListView(
            controller: _controller,
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
                  RenderListAssetElement() => FutureBuilder(
                      future: context.read<AssetGridCubit>().loadAssets(
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
                          padding: const EdgeInsets.all(0),
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
                              child: asset == null || state.isDragScrolling
                                  ? const ImImagePlaceholder()
                                  : ImThumbnail(asset),
                            );
                          },
                          itemCount: section.assetCount,
                        );
                      },
                    ),
                };
              },
              childCount: elements.length,
              addAutomaticKeepAlives: false,
            ),
          );

          final EdgeInsetsGeometry? padding;
          if (widget.topPadding != null) {
            padding = EdgeInsets.only(top: widget.topPadding!);
          } else {
            padding = null;
          }

          return DraggableScrollbar(
            foregroundColor: context.colorScheme.onSurface,
            backgroundColor: context.colorScheme.surfaceContainerHighest,
            scrollStateListener:
                context.read<AssetGridCubit>().setDragScrolling,
            controller: _controller,
            maxItemCount: elements.length,
            labelTextBuilder: (int position) =>
                _labelBuilder(elements, position),
            labelConstraints: const BoxConstraints(maxHeight: 36),
            scrollbarAnimationDuration: Durations.medium2,
            scrollbarTimeToFade: Durations.extralong4,
            padding: padding,
            child: grid,
          );
        },
      );
}
