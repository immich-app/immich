import 'dart:math';

import 'package:openapi/api.dart';

enum RenderAssetGridElementType {
  assetRow,
  dayTitle,
  monthTitle;
}

class RenderAssetGridRow {
  final List<AssetResponseDto> assets;

  RenderAssetGridRow(this.assets);
}

class RenderAssetGridElement {
  final RenderAssetGridElementType type;
  final RenderAssetGridRow? assetRow;
  final String? title;
  final DateTime date;
  final List<AssetResponseDto>? relatedAssetList;

  RenderAssetGridElement(
    this.type, {
    this.assetRow,
    this.title,
    required this.date,
    this.relatedAssetList,
  });
}

List<RenderAssetGridElement> assetsToRenderList(
    List<AssetResponseDto> assets, int assetsPerRow) {
  List<RenderAssetGridElement> elements = [];

  int cursor = 0;
  while (cursor < assets.length) {
    int rowElements = min(assets.length - cursor, assetsPerRow);
    final date = DateTime.parse(assets[cursor].createdAt);

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
