import 'dart:math';

import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

final log = Logger('AssetGridDataStructure');

enum RenderAssetGridElementType {
  assets,
  assetRow,
  groupDividerTitle,
  monthTitle;
}

class RenderAssetGridElement {
  final RenderAssetGridElementType type;
  final String? title;
  final DateTime date;
  final int count;
  final int offset;
  final int totalCount;

  RenderAssetGridElement(
    this.type, {
    this.title,
    required this.date,
    this.count = 0,
    this.offset = 0,
    this.totalCount = 0,
  });
}

enum GroupAssetsBy {
  day,
  month,
  auto,
  none,
  ;
}

class RenderList {
  final List<RenderAssetGridElement> elements;
  final List<Asset>? allAssets;
  final QueryBuilder<Asset, Asset, QAfterSortBy>? query;
  final int totalAssets;
  List<Asset> _buf = [];
  int _bufOffset = 0;

  RenderList(this.elements, this.query, this.allAssets)
      : totalAssets = allAssets?.length ?? query!.countSync();

  bool get isEmpty => totalAssets == 0;

  List<Asset> loadAssets(int offset, int count) {
    assert(offset >= 0);
    assert(count > 0);
    assert(offset + count <= totalAssets);
    if (allAssets != null) {
      return allAssets!.slice(offset, offset + count);
    } else if (query != null) {
      if (offset < _bufOffset || offset + count > _bufOffset + _buf.length) {
        final bool forward = _bufOffset < offset;
        const batchSize = 128;
        const oppositeSize = 32;
        final len = max(batchSize, count + oppositeSize);
        final start = max(
          0,
          forward
              ? offset - oppositeSize
              : (len > batchSize ? offset : offset + count - len),
        );
        _buf = query!.offset(start).limit(len).findAllSync();
        _bufOffset = start;
      }
      assert(_bufOffset <= offset);
      assert(_bufOffset + _buf.length >= offset + count);
      final arr = _buf.slice(offset - _bufOffset, offset - _bufOffset + count);
      return arr;
    }
    throw Exception("RenderList has neither assets nor query");
  }

  Asset loadAsset(int index) {
    if (allAssets != null) {
      return allAssets![index];
    } else if (query != null) {
      final asset = query!.offset(index).findFirstSync();
      if (asset == null) {
        throw Exception(
            "Asset at index $index does no longer exist in database");
      }
    }
    throw Exception("RenderList has neither assets nor query");
  }

  static Future<RenderList> fromQuery(
    QueryBuilder<Asset, Asset, QAfterSortBy> query,
    GroupAssetsBy groupBy,
  ) =>
      _buildRenderList(null, query, groupBy);

  static Future<RenderList> _buildRenderList(
    List<Asset>? assets,
    QueryBuilder<Asset, Asset, QAfterSortBy>? query,
    GroupAssetsBy groupBy,
  ) async {
    final List<RenderAssetGridElement> elements = [];

    const pageSize = 500;
    const sectionSize = 60; // divides evenly by 2,3,4,5,6

    if (groupBy == GroupAssetsBy.none) {
      final int total = assets?.length ?? query!.countSync();
      for (int i = 0; i < total; i += sectionSize) {
        final date = assets != null
            ? assets[i].fileCreatedAt
            : await query!.offset(i).fileCreatedAtProperty().findFirst();
        final int count = i + sectionSize > total ? total - i : sectionSize;
        if (date == null) break;
        elements.add(
          RenderAssetGridElement(
            RenderAssetGridElementType.assets,
            date: date,
            count: count,
            totalCount: total,
          ),
        );
      }
      return RenderList(elements, query, assets);
    }

    final formatSameYear = groupBy == GroupAssetsBy.month
        ? DateFormat.MMMM()
        : DateFormat.MMMMEEEEd();
    final formatOtherYear = groupBy == GroupAssetsBy.month
        ? DateFormat.yMMMM()
        : DateFormat.yMMMMEEEEd();
    final currentYear = DateTime.now().year;
    final formatMergedSameYear = DateFormat.MMMd();
    final formatMergedOtherYear = DateFormat.yMMMd();

    int offset = 0;
    DateTime? last;
    DateTime? current;
    int lastOffset = 0;
    int count = 0;
    int monthCount = 0;
    int lastMonthIndex = 0;

    String formatDateRange(DateTime from, DateTime to) {
      final startDate = (from.year == currentYear
              ? formatMergedSameYear
              : formatMergedOtherYear)
          .format(from);
      final endDate = (to.year == currentYear
              ? formatMergedSameYear
              : formatMergedOtherYear)
          .format(to);
      return "$startDate - $endDate";
    }

    void mergeMonth() {
      if (last != null &&
          groupBy == GroupAssetsBy.auto &&
          monthCount <= 30 &&
          elements.length > lastMonthIndex + 1) {
        // merge all days into a single section
        assert(elements[lastMonthIndex].date.month == last.month);
        final e = elements[lastMonthIndex];

        elements[lastMonthIndex] = RenderAssetGridElement(
          RenderAssetGridElementType.monthTitle,
          date: e.date,
          count: monthCount,
          totalCount: monthCount,
          offset: e.offset,
          title: formatDateRange(e.date, elements.last.date),
        );
        elements.removeRange(lastMonthIndex + 1, elements.length);
      }
    }

    void addElems(DateTime d) {
      final bool newMonth =
          last == null || last.year != d.year || last.month != d.month;
      if (newMonth) {
        mergeMonth();
        lastMonthIndex = elements.length;
        monthCount = 0;
      }
      for (int j = 0; j < count; j += sectionSize) {
        final type = j == 0
            ? (groupBy != GroupAssetsBy.month && newMonth
                ? RenderAssetGridElementType.monthTitle
                : RenderAssetGridElementType.groupDividerTitle)
            : (groupBy == GroupAssetsBy.auto
                ? RenderAssetGridElementType.groupDividerTitle
                : RenderAssetGridElementType.assets);
        final sectionCount = j + sectionSize > count ? count - j : sectionSize;
        assert(sectionCount > 0 && sectionCount <= sectionSize);
        elements.add(
          RenderAssetGridElement(
            type,
            date: d,
            count: sectionCount,
            totalCount: count,
            offset: lastOffset + j,
            title: j == 0
                ? (d.year == currentYear
                    ? formatSameYear.format(d)
                    : formatOtherYear.format(d))
                : (groupBy == GroupAssetsBy.auto
                    ? formatDateRange(d, d) // FIXME two dates
                    : null),
          ),
        );
      }
      monthCount += count;
    }

    while (true) {
      // this iterates all assets (only their createdAt property) in batches
      // memory usage is okay, however runtime is linear with number of assets
      // TODO replace with groupBy once Isar supports such queries
      final dates = assets != null
          ? assets.map((a) => a.fileCreatedAt)
          : await query!
              .offset(offset)
              .limit(pageSize)
              .fileCreatedAtProperty()
              .findAll();
      int i = 0;
      for (final date in dates) {
        final d = DateTime(
          date.year,
          date.month,
          groupBy == GroupAssetsBy.month ? 1 : date.day,
        );
        current ??= d;
        if (current != d) {
          addElems(current);
          last = current;
          current = d;
          lastOffset = offset + i;
          count = 0;
        }
        count++;
        i++;
      }

      if (assets != null || dates.length != pageSize) break;
      offset += pageSize;
    }
    if (count > 0 && current != null) {
      addElems(current);
      mergeMonth();
    }
    assert(elements.every((e) => e.count <= sectionSize), "too large section");
    return RenderList(elements, query, assets);
  }

  static RenderList empty() => RenderList([], null, []);

  static Future<RenderList> fromAssets(
    List<Asset> assets,
    GroupAssetsBy groupBy,
  ) =>
      _buildRenderList(assets, null, groupBy);
}
