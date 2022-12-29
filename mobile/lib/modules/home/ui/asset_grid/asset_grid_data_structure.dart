import 'dart:math';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
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

/// Converts assets grouped by date to the data model required by Immich's custom asset grid implementation.
Future<List<RenderAssetGridElement>> assetGroupsToRenderList(
  Map<String, List<Asset>> assetGroups,
  int assetsPerRow,
) async {

  processData(Map<String, Object> data) {
    final monthFormat = DateFormat(data["month_format"]! as String);
    final dayFormatSameYear = DateFormat(data["day_format"]! as String);
    final dayFormatOtherYear = DateFormat(data["day_format_year"]! as String);
    final groups = data["groups"]! as Map<String, List<Asset>>;
    final perRow = data["per_row"]! as int;

    List<RenderAssetGridElement> elements = [];
    DateTime? lastDate;

    groups.forEach((groupName, assets) {
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
        var currentYear = DateTime
            .now()
            .year;
        var groupYear = DateTime
            .parse(groupName)
            .year;
        var formatDate =
        currentYear == groupYear ? dayFormatSameYear : dayFormatOtherYear;

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
          int rowElements = min(assets.length - cursor, perRow);

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

  return compute(processData, {
    "month_format": "monthly_title_text_date_format".tr(),
    "day_format": "daily_title_text_date".tr(),
    "day_format_year": "daily_title_text_date_year".tr(),
    "groups": assetGroups,
    "per_row": assetsPerRow
  });
}
