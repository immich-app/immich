import 'dart:math';

import 'package:immich_mobile/shared/models/asset.dart';

enum RenderAssetGridElementType {
  assetRow,
  dayTitle,
  monthTitle;
}

class RenderAssetGridRow {
  final List<Asset> assets;

  RenderAssetGridRow(this.assets);
}

class RenderAssetGridElement {
  final RenderAssetGridElementType type;
  final RenderAssetGridRow? assetRow;
  final String? title;
  final DateTime date;
  final List<Asset>? relatedAssetList;

  RenderAssetGridElement(
    this.type, {
    this.assetRow,
    this.title,
    required this.date,
    this.relatedAssetList,
  });
}

List<RenderAssetGridElement> assetsToRenderList(
  List<Asset> assets,
  int assetsPerRow,
) {
  List<RenderAssetGridElement> elements = [];

  int cursor = 0;
  while (cursor < assets.length) {
    int rowElements = min(assets.length - cursor, assetsPerRow);
    final date = assets[cursor].createdAt;

    final rowElement = RenderAssetGridElement(
      RenderAssetGridElementType.assetRow,
      date: date,
      assetRow: RenderAssetGridRow(
        assets.sublist(cursor, cursor + rowElements),
      ),
    );

    elements.add(rowElement);
    cursor += rowElements;
  }

  return elements;
}

List<RenderAssetGridElement> assetGroupsToRenderList(
  Map<String, List<Asset>> assetGroups,
  int assetsPerRow,
) {
  List<RenderAssetGridElement> elements = [];
  DateTime? lastDate;

  assetGroups.forEach((groupName, assets) {
    final date = DateTime.parse(groupName);

    if (lastDate == null || lastDate!.month != date.month) {
      elements.add(
        RenderAssetGridElement(
          RenderAssetGridElementType.monthTitle,
          title: groupName,
          date: date,
        ),
      );
    }

    // Add group title
    elements.add(
      RenderAssetGridElement(
        RenderAssetGridElementType.dayTitle,
        title: groupName,
        date: date,
        relatedAssetList: assets,
      ),
    );

    // Add rows
    int cursor = 0;
    while (cursor < assets.length) {
      int rowElements = min(assets.length - cursor, assetsPerRow);

      final rowElement = RenderAssetGridElement(
        RenderAssetGridElementType.assetRow,
        date: date,
        assetRow: RenderAssetGridRow(
          assets.sublist(cursor, cursor + rowElements),
        ),
      );

      elements.add(rowElement);
      cursor += rowElements;
    }

    lastDate = date;
  });

  return elements;
}
