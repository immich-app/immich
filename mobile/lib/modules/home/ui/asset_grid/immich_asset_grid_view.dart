import 'dart:collection';
import 'dart:developer';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/collection_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/scroll_notifier.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

import 'asset_grid_data_structure.dart';
import 'disable_multi_select_button.dart';
import 'draggable_scrollbar_custom.dart';
import 'group_divider_title.dart';

typedef ImmichAssetGridSelectionListener = void Function(
  bool,
  Set<Asset>,
);

class ImmichAssetGridView extends StatefulWidget {
  final RenderList renderList;
  final int assetsPerRow;
  final double margin;
  final bool showStorageIndicator;
  final ImmichAssetGridSelectionListener? listener;
  final bool selectionActive;
  final Future<void> Function()? onRefresh;
  final Set<Asset>? preselectedAssets;
  final bool canDeselect;
  final bool dynamicLayout;
  final bool showMultiSelectIndicator;
  final void Function(Iterable<ItemPosition> itemPositions)?
      visibleItemsListener;
  final Widget? topWidget;
  final int heroOffset;
  final bool shrinkWrap;
  final bool showDragScroll;
  final bool showStack;

  const ImmichAssetGridView({
    super.key,
    required this.renderList,
    required this.assetsPerRow,
    required this.showStorageIndicator,
    this.listener,
    this.margin = 5.0,
    this.selectionActive = false,
    this.onRefresh,
    this.preselectedAssets,
    this.canDeselect = true,
    this.dynamicLayout = true,
    this.showMultiSelectIndicator = true,
    this.visibleItemsListener,
    this.topWidget,
    this.heroOffset = 0,
    this.shrinkWrap = false,
    this.showDragScroll = true,
    this.showStack = false,
  });

  @override
  State<StatefulWidget> createState() {
    return ImmichAssetGridViewState();
  }
}

class ImmichAssetGridViewState extends State<ImmichAssetGridView> {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

  /// The timestamp when the haptic feedback was last invoked
  int _hapticFeedbackTS = 0;
  DateTime? _prevItemTime;
  bool _scrolling = false;
  final Set<Asset> _selectedAssets =
      LinkedHashSet(equals: (a, b) => a.id == b.id, hashCode: (a) => a.id);

  Set<Asset> _getSelectedAssets() {
    return Set.from(_selectedAssets);
  }

  void _callSelectionListener(bool selectionActive) {
    widget.listener?.call(selectionActive, _getSelectedAssets());
  }

  void _selectAssets(List<Asset> assets) {
    setState(() {
      _selectedAssets.addAll(assets);
      _callSelectionListener(true);
    });
  }

  void _deselectAssets(List<Asset> assets) {
    setState(() {
      _selectedAssets.removeAll(
        assets.where(
          (a) =>
              widget.canDeselect ||
              !(widget.preselectedAssets?.contains(a) ?? false),
        ),
      );
      _callSelectionListener(_selectedAssets.isNotEmpty);
    });
  }

  void _deselectAll() {
    setState(() {
      _selectedAssets.clear();
      if (!widget.canDeselect &&
          widget.preselectedAssets != null &&
          widget.preselectedAssets!.isNotEmpty) {
        _selectedAssets.addAll(widget.preselectedAssets!);
      }
      _callSelectionListener(false);
    });
  }

  bool _allAssetsSelected(List<Asset> assets) {
    return widget.selectionActive &&
        assets.firstWhereOrNull((e) => !_selectedAssets.contains(e)) == null;
  }

  Widget _buildThumbnailOrPlaceholder(Asset asset, int index) {
    return ThumbnailImage(
      asset: asset,
      index: index,
      loadAsset: widget.renderList.loadAsset,
      totalAssets: widget.renderList.totalAssets,
      multiselectEnabled: widget.selectionActive,
      isSelected: widget.selectionActive && _selectedAssets.contains(asset),
      onSelect: () => _selectAssets([asset]),
      onDeselect: widget.canDeselect ||
              widget.preselectedAssets == null ||
              !widget.preselectedAssets!.contains(asset)
          ? () => _deselectAssets([asset])
          : null,
      useGrayBoxPlaceholder: true,
      showStorageIndicator: widget.showStorageIndicator,
      heroOffset: widget.heroOffset,
      showStack: widget.showStack,
    );
  }

  Widget _buildAssetRow(
    Key key,
    BuildContext context,
    List<Asset> assets,
    int absoluteOffset,
    double width,
  ) {
    // Default: All assets have the same width
    final widthDistribution = List.filled(assets.length, 1.0);

    if (widget.dynamicLayout) {
      final aspectRatios =
          assets.map((e) => (e.width ?? 1) / (e.height ?? 1)).toList();
      final meanAspectRatio = aspectRatios.sum / assets.length;

      // 1: mean width
      // 0.5: width < mean - threshold
      // 1.5: width > mean + threshold
      final arConfiguration = aspectRatios.map((e) {
        if (e - meanAspectRatio > 0.3) return 1.5;
        if (e - meanAspectRatio < -0.3) return 0.5;
        return 1.0;
      });

      // Normalize:
      final sum = arConfiguration.sum;
      widthDistribution.setRange(
        0,
        widthDistribution.length,
        arConfiguration.map((e) => (e * assets.length) / sum),
      );
    }
    return Row(
      key: key,
      children: assets.mapIndexed((int index, Asset asset) {
        final bool last = index + 1 == widget.assetsPerRow;
        return Container(
          key: ValueKey(index),
          width: width * widthDistribution[index],
          height: width,
          margin: EdgeInsets.only(
            bottom: widget.margin,
            right: last ? 0.0 : widget.margin,
          ),
          child: _buildThumbnailOrPlaceholder(asset, absoluteOffset + index),
        );
      }).toList(),
    );
  }

  Widget _buildTitle(
    BuildContext context,
    String title,
    List<Asset> assets,
  ) {
    return GroupDividerTitle(
      text: title,
      multiselectEnabled: widget.selectionActive,
      onSelect: () => _selectAssets(assets),
      onDeselect: () => _deselectAssets(assets),
      selected: _allAssetsSelected(assets),
    );
  }

  Widget _buildMonthTitle(BuildContext context, DateTime date) {
    final monthFormat = DateTime.now().year == date.year
        ? DateFormat.MMMM()
        : DateFormat.yMMMM();
    final String title = monthFormat.format(date);
    return Padding(
      key: Key("month-$title"),
      padding: const EdgeInsets.only(left: 12.0, top: 24.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildPlaceHolderRow(Key key, int num, double width, double height) {
    return Row(
      key: key,
      children: [
        for (int i = 0; i < num; i++)
          Container(
            key: ValueKey(i),
            width: width,
            height: height,
            margin: EdgeInsets.only(
              bottom: widget.margin,
              right: i + 1 == num ? 0.0 : widget.margin,
            ),
            color: Colors.grey,
          ),
      ],
    );
  }

  Widget _buildSection(
    BuildContext context,
    RenderAssetGridElement section,
    bool scrolling,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth / widget.assetsPerRow -
            widget.margin * (widget.assetsPerRow - 1) / widget.assetsPerRow;
        final rows =
            (section.count + widget.assetsPerRow - 1) ~/ widget.assetsPerRow;
        final List<Asset> assetsToRender = scrolling
            ? []
            : widget.renderList.loadAssets(section.offset, section.count);
        return Column(
          key: ValueKey(section.offset),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (section.type == RenderAssetGridElementType.monthTitle)
              _buildMonthTitle(context, section.date),
            if (section.type == RenderAssetGridElementType.groupDividerTitle ||
                section.type == RenderAssetGridElementType.monthTitle)
              _buildTitle(
                context,
                section.title!,
                scrolling
                    ? []
                    : widget.renderList
                        .loadAssets(section.offset, section.totalCount),
              ),
            for (int i = 0; i < rows; i++)
              scrolling
                  ? _buildPlaceHolderRow(
                      ValueKey(i),
                      i + 1 == rows
                          ? section.count - i * widget.assetsPerRow
                          : widget.assetsPerRow,
                      width,
                      width,
                    )
                  : _buildAssetRow(
                      ValueKey(i),
                      context,
                      assetsToRender.nestedSlice(
                        i * widget.assetsPerRow,
                        min((i + 1) * widget.assetsPerRow, section.count),
                      ),
                      section.offset + i * widget.assetsPerRow,
                      width,
                    ),
          ],
        );
      },
    );
  }

  Widget _itemBuilder(BuildContext c, int position) {
    int index = position;
    if (widget.topWidget != null) {
      if (index == 0) {
        return widget.topWidget!;
      }
      index--;
    }

    final item = widget.renderList.elements[index];
    return _buildSection(c, item, _scrolling);
  }

  Text _labelBuilder(int pos) {
    final maxLength = widget.renderList.elements.length;
    if (pos < 0 || pos >= maxLength) {
      return const Text("");
    }

    final date = widget.renderList.elements[pos % maxLength].date;

    return Text(
      DateFormat.yMMMM().format(date),
      style: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildMultiSelectIndicator() {
    return DisableMultiSelectButton(
      onPressed: () => _deselectAll(),
      selectedItemCount: _selectedAssets.length,
    );
  }

  Widget _buildAssetGrid() {
    final useDragScrolling =
        widget.showDragScroll && widget.renderList.totalAssets >= 20;

    void dragScrolling(bool active) {
      if (active != _scrolling) {
        setState(() {
          _scrolling = active;
        });
      }
    }

    final listWidget = ScrollablePositionedList.builder(
      padding: const EdgeInsets.only(
        bottom: 220,
      ),
      itemBuilder: _itemBuilder,
      itemPositionsListener: _itemPositionsListener,
      itemScrollController: _itemScrollController,
      itemCount: widget.renderList.elements.length +
          (widget.topWidget != null ? 1 : 0),
      addRepaintBoundaries: true,
      shrinkWrap: widget.shrinkWrap,
    );

    final child = useDragScrolling
        ? DraggableScrollbar.semicircle(
            scrollStateListener: dragScrolling,
            itemPositionsListener: _itemPositionsListener,
            controller: _itemScrollController,
            backgroundColor: context.themeData.hintColor,
            labelTextBuilder: _labelBuilder,
            labelConstraints: const BoxConstraints(maxHeight: 28),
            scrollbarAnimationDuration: const Duration(milliseconds: 300),
            scrollbarTimeToFade: const Duration(milliseconds: 1000),
            child: listWidget,
          )
        : listWidget;
    return widget.onRefresh == null
        ? child
        : RefreshIndicator(onRefresh: widget.onRefresh!, child: child);
  }

  @override
  void didUpdateWidget(ImmichAssetGridView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.selectionActive) {
      setState(() {
        _selectedAssets.clear();
      });
    }
  }

  @override
  void initState() {
    super.initState();
    scrollToTopNotifierProvider.addListener(_scrollToTop);
    if (widget.visibleItemsListener != null) {
      _itemPositionsListener.itemPositions.addListener(_positionListener);
    }
    if (widget.preselectedAssets != null) {
      _selectedAssets.addAll(widget.preselectedAssets!);
    }

    _itemPositionsListener.itemPositions.addListener(_hapticsListener);
  }

  @override
  void dispose() {
    scrollToTopNotifierProvider.removeListener(_scrollToTop);
    if (widget.visibleItemsListener != null) {
      _itemPositionsListener.itemPositions.removeListener(_positionListener);
    }
    super.dispose();
  }

  void _positionListener() {
    final values = _itemPositionsListener.itemPositions.value;
    widget.visibleItemsListener?.call(values);
  }

  void _hapticsListener() {
    /// throttle interval for the haptic feedback in microseconds.
    /// Currently set to 100ms.
    const feedbackInterval = 100000;

    final values = _itemPositionsListener.itemPositions.value;
    final start = values.firstOrNull;

    if (start != null) {
      final pos = start.index;
      final maxLength = widget.renderList.elements.length;
      if (pos < 0 || pos >= maxLength) {
        return;
      }

      final date = widget.renderList.elements[pos].date;

      // only provide the feedback if the prev. date is known.
      // Otherwise the app would provide the haptic feedback
      // on startup.
      if (_prevItemTime == null) {
        _prevItemTime = date;
      } else if (_prevItemTime?.year != date.year ||
          _prevItemTime?.month != date.month) {
        _prevItemTime = date;

        final now = Timeline.now;
        if (now > (_hapticFeedbackTS + feedbackInterval)) {
          _hapticFeedbackTS = now;
          HapticFeedback.heavyImpact();
        }
      }
    }
  }

  void _scrollToTop() {
    // for some reason, this is necessary as well in order
    // to correctly reposition the drag thumb scroll bar
    _itemScrollController.jumpTo(
      index: 0,
    );
    _itemScrollController.scrollTo(
      index: 0,
      duration: const Duration(milliseconds: 200),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !(widget.selectionActive && _selectedAssets.isNotEmpty),
      onPopInvoked: (didPop) => !didPop ? _deselectAll() : null,
      child: Stack(
        children: [
          _buildAssetGrid(),
          if (widget.showMultiSelectIndicator && widget.selectionActive)
            _buildMultiSelectIndicator(),
        ],
      ),
    );
  }
}
