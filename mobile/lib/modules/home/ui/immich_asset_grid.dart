import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_render_list_provider.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:openapi/api.dart';

class ImmichAssetGrid extends HookConsumerWidget {
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

  Widget _buildAssetRow(BuildContext context, RenderAssetGridRow row) {
    double size = MediaQuery.of(context).size.width / assetsPerRow -
        margin * (assetsPerRow - 1) / assetsPerRow;

    return Row(
      key: Key("asset-row-${row.assets.first.id}"),
      children: row.assets.map((AssetResponseDto asset) {
        bool last = asset == row.assets.last;

        return Container(
          key: Key("asset-${asset.id}"),
          width: size,
          height: size,
          margin: EdgeInsets.only(top: margin, right: last ? 0.0 : margin),
          child: ThumbnailImage(
            asset: asset,
            assetList: _assets,
            showStorageIndicator: showStorageIndicator,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTitle(BuildContext context, String title) {
    var currentYear = DateTime.now().year;
    var groupYear = DateTime.parse(title).year;

    var formatDateTemplate = currentYear == groupYear
        ? "daily_title_text_date".tr()
        : "daily_title_text_date_year".tr();
    var dateText = DateFormat(formatDateTemplate).format(DateTime.parse(title));

    return Padding(
      key: Key("date-$title"),
      padding: const EdgeInsets.only(
        left: 12.0,
        top: 12.0,
        bottom: 12.0,
      ),
      child: Text(
        dateText,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
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
    final item = renderList[position];

    if (item.type == RenderAssetGridElementType.dayTitle) {
      return _buildTitle(c, item.title!);
    } else if (item.type == RenderAssetGridElementType.monthTitle) {
      return _buildMonthTitle(c, item.title!);
    } else if (item.type == RenderAssetGridElementType.assetRow) {
      return _buildAssetRow(c, item.assetRow!);
    }

    return const Text("Invalid widget type!");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      itemBuilder: _itemBuilder,
      itemCount: renderList.length,
    ).build(context);
  }
}
