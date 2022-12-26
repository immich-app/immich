import 'dart:math';

import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:logging/logging.dart';

final log = Logger('AssetGridDataStructure');

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

  final monthFormat = DateFormat("monthly_title_text_date_format".tr());
  final dayFormatSameYear = DateFormat("daily_title_text_date".tr());
  final dayFormatOtherYear = DateFormat("daily_title_text_date_year".tr());

  assetGroups.forEach((groupName, assets) {
    try {

      final date = DateTime.parse(groupName);

      if (lastDate == null || lastDate!.month != date.month) {
        // Month title

        var monthTitleText = groupName;

        try {
          monthTitleText = monthFormat.format(DateTime.parse(groupName));
        } catch (e) {
          log.severe("Failed to format date for month title: $groupName");
        }

        elements.add(
          RenderAssetGridElement(
            RenderAssetGridElementType.monthTitle,
            title: monthTitleText,
            date: date,
          ),
        );
      }

      // Add group title
      var currentYear = DateTime.now().year;
      var groupYear = DateTime.parse(groupName).year;
      var formatDate = currentYear == groupYear
          ? dayFormatSameYear
          : dayFormatOtherYear;

      var dateText = groupName;

      try {
        dateText = formatDate.format(DateTime.parse(groupName));
      } catch (e) {
        log.severe("Failed to format date for day title: $groupName");
      }

      elements.add(
        RenderAssetGridElement(
          RenderAssetGridElementType.dayTitle,
          title: dateText,
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
    } catch (e, stackTrace) {
      log.severe(e, stackTrace);
    }
  });

  return elements;
}
