import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_list_v2/daily_title_text.dart';
import 'package:immich_mobile/modules/home/ui/asset_list_v2/draggable_scrollbar_custom.dart';
import 'package:openapi/api.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

import '../thumbnail_image.dart';
import 'asset_grid_data_structure.dart';

class ImmichAssetGrid extends HookConsumerWidget {
  final ItemScrollController _itemScrollController = ItemScrollController();
  final ItemPositionsListener _itemPositionsListener =
      ItemPositionsListener.create();

  final List<RenderAssetGridElement> renderList;
  final int assetsPerRow;
  final double margin;
  final bool showStorageIndicator;

  ImmichAssetGrid({
    super.key,
    required this.renderList,
    required this.assetsPerRow,
    required this.showStorageIndicator,
    this.margin = 5.0,
  });

  List<AssetResponseDto> get _assets {
    return renderList
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

  double _getItemSize(BuildContext context) {
    return MediaQuery.of(context).size.width / assetsPerRow -
        margin * (assetsPerRow - 1) / assetsPerRow;
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
      showStorageIndicator: showStorageIndicator,
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
          margin: EdgeInsets.only(top: margin, right: last ? 0.0 : margin),
          child: _buildThumbnailOrPlaceholder(asset, scrolling),
        );
      }).toList(),
    );
  }

  Widget _buildTitle(
      BuildContext context, String title, List<AssetResponseDto> assets) {
    return DailyTitleText(
      isoDate: title,
      assetGroup: assets,
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

  Widget _itemBuilder(BuildContext c, int position, bool scrolling) {
    final item = renderList[position];

    if (item.type == RenderAssetGridElementType.dayTitle) {
      return _buildTitle(c, item.title!, item.relatedAssetList!);
    } else if (item.type == RenderAssetGridElementType.monthTitle) {
      return _buildMonthTitle(c, item.title!);
    } else if (item.type == RenderAssetGridElementType.assetRow) {
      return _buildAssetRow(c, item.assetRow!, scrolling);
    }

    return const Text("Invalid widget type!");
  }

  Text _labelBuilder(int pos) {
    final date = renderList[pos].date;
    return Text(DateFormat.yMMMd().format(date),
      style: const TextStyle(
        color: Colors.white,
        fontWeight: FontWeight.bold,
      ),
    );
  }


  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scrolling = useState(false);

    final useDragScrolling = _assets.length > 100;

    void dragScrolling(bool active) {
      scrolling.value = active;
    }

    Widget itemBuilder(BuildContext c, int position) {
      return _itemBuilder(c, position, scrolling.value);
    }

    final listWidget = ScrollablePositionedList.builder(
      itemBuilder: itemBuilder,
      itemPositionsListener: _itemPositionsListener,
      itemScrollController: _itemScrollController,
      itemCount: renderList.length,
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
}
