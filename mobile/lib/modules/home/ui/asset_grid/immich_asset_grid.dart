import 'dart:collection';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'asset_grid_data_structure.dart';
import 'group_divider_title.dart';
import 'disable_multi_select_button.dart';
import 'draggable_scrollbar_custom.dart';

typedef ImmichAssetGridSelectionListener = void Function(
  bool,
  Set<Asset>,
);

class ImmichAssetGridState extends State<ImmichAssetGrid> {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

  bool _scrolling = false;
  final Set<String> _selectedAssets = HashSet();

  Set<Asset> _getSelectedAssets() {
    return _selectedAssets
        .map((e) => widget.allAssets.firstWhereOrNull((a) => a.id == e))
        .whereNotNull()
        .toSet();
  }

  void _callSelectionListener(bool selectionActive) {
    widget.listener?.call(selectionActive, _getSelectedAssets());
  }

  void _selectAssets(List<Asset> assets) {
    setState(() {
      for (var e in assets) {
        _selectedAssets.add(e.id);
      }
      _callSelectionListener(true);
    });
  }

  void _deselectAssets(List<Asset> assets) {
    setState(() {
      for (var e in assets) {
        _selectedAssets.remove(e.id);
      }
      _callSelectionListener(_selectedAssets.isNotEmpty);
    });
  }

  void _deselectAll() {
    setState(() {
      _selectedAssets.clear();
    });

    _callSelectionListener(false);
  }

  bool _allAssetsSelected(List<Asset> assets) {
    return widget.selectionActive &&
        assets.firstWhereOrNull((e) => !_selectedAssets.contains(e.id)) == null;
  }

  Widget _buildThumbnailOrPlaceholder(
    Asset asset,
    bool placeholder,
  ) {
    if (placeholder) {
      return const DecoratedBox(
        decoration: BoxDecoration(color: Colors.grey),
      );
    }
    return ThumbnailImage(
      asset: asset,
      assetList: widget.allAssets,
      multiselectEnabled: widget.selectionActive,
      isSelected: widget.selectionActive && _selectedAssets.contains(asset.id),
      onSelect: () => _selectAssets([asset]),
      onDeselect: () => _deselectAssets([asset]),
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
              child: _buildThumbnailOrPlaceholder(asset, scrolling),
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

  Widget _buildMonthTitle(BuildContext context, String title) {
    return Padding(
      key: Key("month-$title"),
      padding: const EdgeInsets.only(left: 12.0, top: 32),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).textTheme.headline1?.color,
        ),
      ),
    );
  }

  Widget _itemBuilder(BuildContext c, int position) {
    final item = widget.renderList.elements[position];

    if (item.type == RenderAssetGridElementType.groupDividerTitle) {
      return _buildTitle(c, item.title!, item.relatedAssetList!);
    } else if (item.type == RenderAssetGridElementType.monthTitle) {
      return _buildMonthTitle(c, item.title!);
    } else if (item.type == RenderAssetGridElementType.assetRow) {
      return _buildAssetRow(c, item.assetRow!, _scrolling);
    }

    return const Text("Invalid widget type!");
  }

  Text _labelBuilder(int pos) {
    final date = widget.renderList.elements[pos].date;
    return Text(
      DateFormat.yMMMd().format(date),
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
    final useDragScrolling = widget.allAssets.length >= 20;

    void dragScrolling(bool active) {
      setState(() {
        _scrolling = active;
      });
    }

    final listWidget = ScrollablePositionedList.builder(
      itemBuilder: _itemBuilder,
      itemPositionsListener: _itemPositionsListener,
      itemScrollController: _itemScrollController,
      itemCount: widget.renderList.elements.length,
      addRepaintBoundaries: true,
    );

    if (!useDragScrolling) {
      return listWidget;
    }

    return DraggableScrollbar.semicircle(
      scrollStateListener: dragScrolling,
      itemPositionsListener: _itemPositionsListener,
      controller: _itemScrollController,
      backgroundColor: Theme.of(context).hintColor,
      labelTextBuilder: _labelBuilder,
      labelConstraints: const BoxConstraints(maxHeight: 28),
      scrollbarAnimationDuration: const Duration(seconds: 1),
      scrollbarTimeToFade: const Duration(seconds: 4),
      child: listWidget,
    );
  }

  @override
  void didUpdateWidget(ImmichAssetGrid oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.selectionActive) {
      setState(() {
        _selectedAssets.clear();
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

class ImmichAssetGrid extends StatefulWidget {
  final RenderList renderList;
  final int assetsPerRow;
  final double margin;
  final bool showStorageIndicator;
  final ImmichAssetGridSelectionListener? listener;
  final bool selectionActive;
  final List<Asset> allAssets;

  const ImmichAssetGrid({
    super.key,
    required this.renderList,
    required this.allAssets,
    required this.assetsPerRow,
    required this.showStorageIndicator,
    this.listener,
    this.margin = 5.0,
    this.selectionActive = false,
  });

  @override
  State<StatefulWidget> createState() {
    return ImmichAssetGridState();
  }
}
