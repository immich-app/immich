import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/thumbnail_image.dart';
import 'package:openapi/api.dart';

enum _AssetGridElementType {
  assetRow,
  title;
}

class _AssetGridRow {
  final List<AssetResponseDto> assets;

  _AssetGridRow(this.assets);
}

class _AssetGridElement {
  final _AssetGridElementType type;
  final _AssetGridRow? assetRow;
  final String? title;

  _AssetGridElement(this.type, {this.assetRow, this.title});
}

class ImmichAssetGrid extends HookConsumerWidget {
  final Map<String, List<AssetResponseDto>> assetGroups;
  final int assetsPerRow;
  final double margin;
  final bool showStorageIndicator;

  const ImmichAssetGrid(
      {super.key,
      required this.assetGroups,
      required this.assetsPerRow,
      required this.showStorageIndicator,
      this.margin = 5.0});

  List<_AssetGridElement> get _renderList {
    List<_AssetGridElement> elements = [];

    assetGroups.forEach((groupName, assets) {
      // Add group title
      elements.add(
        _AssetGridElement(_AssetGridElementType.title, title: groupName),
      );
      // Add rows
      int cursor = 0;
      while (cursor < assets.length - 1) {
        int rowElements = min(assets.length - cursor, assetsPerRow);
        final rowElement = _AssetGridElement(
          _AssetGridElementType.assetRow,
          assetRow: _AssetGridRow(
            assets.sublist(cursor, cursor + rowElements),
          ),
        );

        elements.add(rowElement);
        cursor += rowElements;
      }
    });

    return elements;
  }

  List<AssetResponseDto> get _assets {
    return assetGroups.entries.map((e) => e.value).flattened.toList();
  }

  Widget _buildAssetRow(BuildContext context, _AssetGridRow row) {
    double size = MediaQuery.of(context).size.width / assetsPerRow - margin * 2;

    return Row(
      children: row.assets.map((AssetResponseDto asset) {
        return Container(
          key: Key(asset.id),
          width: size,
          height: size,
          margin: EdgeInsets.all(margin),
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

    return Container(
      key: Key(title),
      margin: const EdgeInsets.symmetric(vertical: 12),
      child: Text(
        dateText,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _itemBuilder(BuildContext c, int position) {
    final item = _renderList[position];

    if (item.type == _AssetGridElementType.title) {
      return _buildTitle(c, item.title!);
    } else if (item.type == _AssetGridElementType.assetRow) {
      return _buildAssetRow(c, item.assetRow!);
    }

    return const Text("Invalid widget type!");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      itemBuilder: _itemBuilder,
      itemCount: _renderList.length,
    ).build(context);
  }
}
