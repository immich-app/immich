import 'dart:collection';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/scroll_notifier.provider.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'asset_grid_data_structure.dart';
import 'group_divider_title.dart';
import 'disable_multi_select_button.dart';
import 'draggable_scrollbar_custom.dart';

typedef ImmichAssetGridSelectionListener = void Function(
  bool,
  Set<Asset>,
);

class ImmichAssetGridViewState extends State<ImmichAssetGridView> {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

  bool _scrolling = false;
  final Set<Asset> _selectedAssets =
      HashSet(equals: (a, b) => a.id == b.id, hashCode: (a) => a.id);
  int outerRender = 0;
  int innerRender = 0;

  Set<Asset> _getSelectedAssets() {
    return _selectedAssets;
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
      _selectedAssets.removeAll(assets);
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

  Widget _buildThumbnailOrPlaceholder(
    Asset asset,
    bool placeholder,
    int index,
  ) {
    innerRender++;
    debugPrint("InnerRender $innerRender");
    if (placeholder) {
      return const DecoratedBox(
        decoration: BoxDecoration(color: Colors.grey),
      );
    }
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
    );
  }

  Widget _buildAssetRow(
    BuildContext context,
    RenderAssetGridRow row,
    bool scrolling,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = constraints.maxWidth / widget.assetsPerRow -
            widget.margin * (widget.assetsPerRow - 1) / widget.assetsPerRow;
        return Row(
          key: Key("asset-row-${row.assets.first.id}"),
          children: row.assets.mapIndexed((int index, Asset asset) {
            bool last = asset.id == row.assets.last.id;

            return Container(
              key: Key("asset-${asset.id}"),
              width: size * row.widthDistribution[index],
              height: size,
              margin: EdgeInsets.only(
                top: widget.margin,
                right: last ? 0.0 : widget.margin,
              ),
              child: _buildThumbnailOrPlaceholder(
                asset,
                scrolling,
                row.startIndex + index,
              ),
            );
          }).toList(),
        );
      },
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
      padding: const EdgeInsets.only(left: 12.0, top: 30),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).textTheme.displayLarge?.color,
        ),
      ),
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
        final cols =
            (section.count + widget.assetsPerRow - 1) ~/ widget.assetsPerRow;
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
            for (int i = 0; i < cols; i++)
              scrolling
                  ? Container(
                      width: constraints.maxWidth,
                      height: width,
                      margin: EdgeInsets.only(top: widget.margin),
                      color: Colors.grey,
                    )
                  : Row(
                      key: ValueKey(i),
                      children: widget.renderList
                          .loadAssets(section.offset, section.count)
                          .nestedSlice(
                            i * widget.assetsPerRow,
                            min((i + 1) * widget.assetsPerRow, section.count),
                          )
                          .mapIndexed((int index, Asset asset) {
                        final bool last = index + 1 == widget.assetsPerRow;
                        return Container(
                          key: ValueKey(index),
                          width: width,
                          height: width,
                          margin: EdgeInsets.only(
                            top: widget.margin,
                            right: last ? 0.0 : widget.margin,
                          ),
                          child: _buildThumbnailOrPlaceholder(
                            asset,
                            scrolling,
                            section.offset + i * widget.assetsPerRow + index,
                          ),
                        );
                      }).toList(),
                    )
          ],
        );
      },
    );
  }

  Widget _itemBuilder(BuildContext c, int position) {
    final item = widget.renderList.elements[position];

    outerRender++;
    debugPrint("Outer render $outerRender");

    return _buildSection(c, item, _scrolling);
  }

  Text _labelBuilder(int pos) {
    final date = widget.renderList.elements[pos].date;
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
    final useDragScrolling = widget.renderList.totalAssets >= 20;

    void dragScrolling(bool active) {
      setState(() {
        _scrolling = active;
      });
    }

    final listWidget = ScrollablePositionedList.builder(
      padding: const EdgeInsets.only(
        bottom: 220,
      ),
      itemBuilder: _itemBuilder,
      itemPositionsListener: _itemPositionsListener,
      itemScrollController: _itemScrollController,
      itemCount: widget.renderList.elements.length,
      addRepaintBoundaries: true,
    );

    final child = useDragScrolling
        ? DraggableScrollbar.semicircle(
            scrollStateListener: dragScrolling,
            itemPositionsListener: _itemPositionsListener,
            controller: _itemScrollController,
            backgroundColor: Theme.of(context).hintColor,
            labelTextBuilder: _labelBuilder,
            labelConstraints: const BoxConstraints(maxHeight: 28),
            scrollbarAnimationDuration: const Duration(seconds: 1),
            scrollbarTimeToFade: const Duration(seconds: 4),
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
    } else if (widget.preselectedAssets != null) {
      setState(() {
        _selectedAssets.addAll(widget.preselectedAssets!);
      });
    }
  }

  Future<bool> onWillPop() async {
    if (widget.selectionActive && _selectedAssets.isNotEmpty) {
      _deselectAll();
      return false;
    }

    return true;
  }

  @override
  void initState() {
    super.initState();
    scrollToTopNotifierProvider.addListener(_scrollToTop);
  }

  @override
  void dispose() {
    scrollToTopNotifierProvider.removeListener(_scrollToTop);
    super.dispose();
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
    return WillPopScope(
      onWillPop: onWillPop,
      child: Stack(
        children: [
          _buildAssetGrid(),
          if (widget.selectionActive) _buildMultiSelectIndicator(),
        ],
      ),
    );
  }
}

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
  });

  @override
  State<StatefulWidget> createState() {
    return ImmichAssetGridViewState();
  }
}
