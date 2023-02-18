import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:logging/logging.dart';

final log = Logger('AssetGridDataStructure');

enum RenderAssetGridElementType {
  assetRow,
  groupDividerTitle,
  monthTitle;
}

class RenderAssetGridRow {
  final List<Asset> assets;
  final List<double> widthDistribution;

  RenderAssetGridRow(this.assets, this.widthDistribution);
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

enum GroupAssetsBy {
  day,
  month;
}

class AssetGridLayoutParameters {
  final int perRow;
  final bool dynamicLayout;
  final GroupAssetsBy groupBy;

  AssetGridLayoutParameters(
    this.perRow,
    this.dynamicLayout,
    this.groupBy,
  );
}

class _AssetGroupsToRenderListComputeParameters {
  final String monthFormat;
  final String dayFormat;
  final String dayFormatYear;
  final List<Asset> assets;
  final AssetGridLayoutParameters layout;

  _AssetGroupsToRenderListComputeParameters(
    this.monthFormat,
    this.dayFormat,
    this.dayFormatYear,
    this.assets,
    this.layout,
  );
}

class RenderList {
  final List<RenderAssetGridElement> elements;

  RenderList(this.elements);

  static Map<DateTime, List<Asset>> _groupAssets(
    List<Asset> assets,
    GroupAssetsBy groupBy,
  ) {
    if (groupBy == GroupAssetsBy.day) {
      return assets.groupListsBy(
        (element) {
          final date = element.fileCreatedAt.toLocal();
          return DateTime(date.year, date.month, date.day);
        },
      );
    } else if (groupBy == GroupAssetsBy.month) {
      return assets.groupListsBy(
        (element) {
          final date = element.fileCreatedAt.toLocal();
          return DateTime(date.year, date.month);
        },
      );
    }

    return {};
  }

  static Future<RenderList> _processAssetGroupData(
    _AssetGroupsToRenderListComputeParameters data,
  ) async {
    final monthFormat = DateFormat(data.monthFormat);
    final dayFormatSameYear = DateFormat(data.dayFormat);
    final dayFormatOtherYear = DateFormat(data.dayFormatYear);
    final allAssets = data.assets;
    final perRow = data.layout.perRow;
    final dynamicLayout = data.layout.dynamicLayout;
    final groupBy = data.layout.groupBy;

    List<RenderAssetGridElement> elements = [];
    DateTime? lastDate;

    final groups = _groupAssets(allAssets, groupBy);

    groups.entries.sortedBy((e) =>e.key).reversed.forEach((entry) {
      final date = entry.key;
      final assets = entry.value;

      try {
        // Month title
        if (groupBy == GroupAssetsBy.day &&
            (lastDate == null || lastDate!.month != date.month)) {
          elements.add(
            RenderAssetGridElement(
              RenderAssetGridElementType.monthTitle,
              title: monthFormat.format(date),
              date: date,
            ),
          );
        }

        // Group divider title (day or month)
        var formatDate = dayFormatOtherYear;

        if (DateTime.now().year == date.year) {
          formatDate = dayFormatSameYear;
        }

        if (groupBy == GroupAssetsBy.month) {
          formatDate = monthFormat;
        }

        elements.add(
          RenderAssetGridElement(
            RenderAssetGridElementType.groupDividerTitle,
            title: formatDate.format(date),
            date: date,
            relatedAssetList: assets,
          ),
        );

        // Add rows
        int cursor = 0;
        while (cursor < assets.length) {
          int rowElements = min(assets.length - cursor, perRow);
          final rowAssets = assets.sublist(cursor, cursor + rowElements);

          // Default: All assets have the same width
          var widthDistribution = List.filled(rowElements, 1.0);

          if (dynamicLayout) {
            final aspectRatios =
                rowAssets.map((e) => (e.width ?? 1) / (e.height ?? 1)).toList();
            final meanAspectRatio = aspectRatios.sum / rowElements;

            // 1: mean width
            // 0.5: width < mean - threshold
            // 1.5: width > mean + threshold
            final arConfiguration = aspectRatios.map((e) {
              if (e - meanAspectRatio > 0.3) return 1.5;
              if (e - meanAspectRatio < -0.3) return 0.5;
              return 1.0;
            });

            // Normalize:
            final sum = arConfiguration.sum;
            widthDistribution =
                arConfiguration.map((e) => (e * rowElements) / sum).toList();
          }

          final rowElement = RenderAssetGridElement(
            RenderAssetGridElementType.assetRow,
            date: date,
            assetRow: RenderAssetGridRow(
              rowAssets,
              widthDistribution,
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

  static Future<RenderList> fromAssets(
    List<Asset> assets,
    AssetGridLayoutParameters layout,
  ) async {
    // Compute only allows for one parameter. Therefore we pass all parameters in a map
    return compute(
      _processAssetGroupData,
      _AssetGroupsToRenderListComputeParameters(
        "monthly_title_text_date_format".tr(),
        "daily_title_text_date".tr(),
        "daily_title_text_date_year".tr(),
        assets,
        layout,
      ),
    );
  }
}
