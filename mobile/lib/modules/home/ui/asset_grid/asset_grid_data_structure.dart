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

class _AssetGroupsToRenderListComputeParameters {
  final String monthFormat;
  final String dayFormat;
  final String dayFormatYear;
  final Map<String, List<Asset>> groups;
  final int perRow;

  _AssetGroupsToRenderListComputeParameters(
    this.monthFormat,
    this.dayFormat,
    this.dayFormatYear,
    this.groups,
    this.perRow,
  );
}

class RenderList {
  final List<RenderAssetGridElement> elements;

  RenderList(this.elements);

  static Future<RenderList> _processAssetGroupData(
    _AssetGroupsToRenderListComputeParameters data,
  ) async {
    final monthFormat = DateFormat(data.monthFormat);
    final dayFormatSameYear = DateFormat(data.dayFormat);
    final dayFormatOtherYear = DateFormat(data.dayFormatYear);
    final groups = data.groups;
    final perRow = data.perRow;

    List<RenderAssetGridElement> elements = [];
    DateTime? lastDate;

    groups.forEach((groupName, assets) {
      try {
        final date = DateTime.parse(groupName);

        if (lastDate == null || lastDate!.month != date.month) {
          // Month title

          var monthTitleText = groupName;

          var groupDate = DateTime.tryParse(groupName);
          if (groupDate != null) {
            monthTitleText = monthFormat.format(groupDate);
          } else {
            log.severe("Failed to format date for day title: $groupName");
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
        var formatDate =
            currentYear == groupYear ? dayFormatSameYear : dayFormatOtherYear;

        var dateText = groupName;

        var groupDate = DateTime.tryParse(groupName);
        if (groupDate != null) {
          dateText = formatDate.format(groupDate);
        } else {
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

    return RenderList(elements);
  }

  static Future<RenderList> fromAssetGroups(
    Map<String, List<Asset>> assetGroups,
    int assetsPerRow,
  ) async {
    // Compute only allows for one parameter. Therefore we pass all parameters in a map
    return compute(
      _processAssetGroupData,
      _AssetGroupsToRenderListComputeParameters(
        "monthly_title_text_date_format".tr(),
        "daily_title_text_date".tr(),
        "daily_title_text_date_year".tr(),
        assetGroups,
        assetsPerRow,
      ),
    );
  }
}
