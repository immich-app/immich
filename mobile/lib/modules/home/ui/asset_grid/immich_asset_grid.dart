import 'dart:collection';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_image.dart';
import 'package:openapi/api.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';
import 'asset_grid_data_structure.dart';
import 'daily_title_text.dart';
import 'disable_multi_select_button.dart';
import 'draggable_scrollbar_custom.dart';

typedef ImmichAssetGridSelectionListener = void Function(
    bool, Set<AssetResponseDto>);

class ImmichAssetGridState extends State<ImmichAssetGrid> {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

  bool _scrolling = false;
  bool _multiselect = false;
  Set<String> _selectedAssets = HashSet();

  List<AssetResponseDto> get _assets {
    return widget.renderList
        .map((e) {
          if (e.type == RenderAssetGridElementType.assetRow) {
            return e.assetRow!.assets;
          } else {
            return List<AssetResponseDto>.empty();
          }
        })
        .flattened
        .toList();
  }

  Set<AssetResponseDto> _getSelectedAssets() {
    return _selectedAssets
        .map((e) => _assets.firstWhereOrNull((a) => a.id == e))
        .whereNotNull()
        .toSet();
  }

  void _callSelectionListener() {
    widget.listener?.call(_multiselect, _getSelectedAssets());
  }

  void _selectAssets(List<AssetResponseDto> assets) {
    setState(() {
      for (var e in assets) {
        _selectedAssets.add(e.id);
      }

      _multiselect = true;
      _callSelectionListener();
    });
  }

  void _deselectAssets(List<AssetResponseDto> assets) {
    setState(() {
      for (var e in assets) {
        _selectedAssets.remove(e.id);
      }

      if (_selectedAssets.isEmpty) {
        _multiselect = false;
      }

      _callSelectionListener();
    });
  }

  void _deselectAll() {
    setState(() {
      _multiselect = false;
      _selectedAssets.clear();
    });

    _callSelectionListener();
  }

  bool _allAssetsSelected(List<AssetResponseDto> assets) {
    return _multiselect &&
        assets.firstWhereOrNull((e) => !_selectedAssets.contains(e.id)) == null;
  }

  double _getItemSize(BuildContext context) {
    return MediaQuery.of(context).size.width / widget.assetsPerRow -
        widget.margin * (widget.assetsPerRow - 1) / widget.assetsPerRow;
  }

  Widget _buildThumbnailOrPlaceholder(
      AssetResponseDto asset, bool placeholder) {
    if (placeholder) {
      return const DecoratedBox(
        decoration: BoxDecoration(color: Colors.grey),
      );
    }
    return ThumbnailImage(
      asset: asset,
      assetList: _assets,
      multiselectEnabled: _multiselect,
      isSelected: _selectedAssets.contains(asset.id),
      onSelect: () => _selectAssets([asset]),
      onDeselect: () => _deselectAssets([asset]),
      useGrayBoxPlaceholder: true,
    );
  }

  Widget _buildAssetRow(
      BuildContext context, RenderAssetGridRow row, bool scrolling) {
    double size = _getItemSize(context);

    return Row(
      key: Key("asset-row-${row.assets.first.id}"),
      children: row.assets.map((AssetResponseDto asset) {
        bool last = asset == row.assets.last;

        return Container(
          key: Key("asset-${asset.id}"),
          width: size,
          height: size,
          margin: EdgeInsets.only(
              top: widget.margin, right: last ? 0.0 : widget.margin),
          child: _buildThumbnailOrPlaceholder(asset, scrolling),
        );
      }).toList(),
    );
  }

  Widget _buildTitle(
      BuildContext context, String title, List<AssetResponseDto> assets) {
    return DailyTitleText(
      isoDate: title,
      multiselectEnabled: _multiselect,
      onSelect: () => _selectAssets(assets),
      onDeselect: () => _deselectAssets(assets),
      selected: _allAssetsSelected(assets),
    );
  }

  Widget _buildMonthTitle(BuildContext context, String title) {
    var monthTitleText = DateFormat("monthly_title_text_date_format".tr())
        .format(DateTime.parse(title));

    return Padding(
      key: Key("month-$title"),
      padding: const EdgeInsets.only(left: 12.0, top: 32),
      child: Text(
        monthTitleText,
        style: TextStyle(
          fontSize: 26,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).textTheme.headline1?.color,
        ),
      ),
    );
  }

  Widget _itemBuilder(BuildContext c, int position) {
    final item = widget.renderList[position];

    if (item.type == RenderAssetGridElementType.dayTitle) {
      return _buildTitle(c, item.title!, item.relatedAssetList!);
    } else if (item.type == RenderAssetGridElementType.monthTitle) {
      return _buildMonthTitle(c, item.title!);
    } else if (item.type == RenderAssetGridElementType.assetRow) {
      return _buildAssetRow(c, item.assetRow!, _scrolling);
    }

    return const Text("Invalid widget type!");
  }

  Text _labelBuilder(int pos) {
    final date = widget.renderList[pos].date;
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
    final useDragScrolling = _assets.length > 100;

    void dragScrolling(bool active) {
      setState(() {
        _scrolling = active;
      });
    }

    final listWidget = ScrollablePositionedList.builder(
      itemBuilder: _itemBuilder,
      itemPositionsListener: _itemPositionsListener,
      itemScrollController: _itemScrollController,
      itemCount: widget.renderList.length,
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
  Widget build(BuildContext context) {
    return Stack(
      children: [
        _buildAssetGrid(),
        if (_multiselect) _buildMultiSelectIndicator(),
      ],
    );
  }
}

class ImmichAssetGrid extends StatefulWidget {
  final List<RenderAssetGridElement> renderList;
  final int assetsPerRow;
  final double margin;
  final bool showStorageIndicator;
  final ImmichAssetGridSelectionListener? listener;

  ImmichAssetGrid({
    super.key,
    required this.renderList,
    required this.assetsPerRow,
    required this.showStorageIndicator,
    this.listener,
    this.margin = 5.0,
  });

  @override
  State<StatefulWidget> createState() {
    return ImmichAssetGridState();
  }
}
