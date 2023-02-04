import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/shared/models/asset.dart';

void main() {
  final List<Asset> testAssets = [];

  for (int i = 0; i < 150; i++) {
    int month = i ~/ 31;
    int day = (i % 31).toInt();

    DateTime date = DateTime(2022, month, day);

    testAssets.add(
      Asset(
        deviceAssetId: '$i',
        deviceId: '',
        ownerId: '',
        createdAt: date,
        modifiedAt: date,
        durationInSeconds: 0,
        fileName: '',
      ),
    );
  }

  final Map<String, List<Asset>> groups = {
    '2022-01-05': testAssets.sublist(0, 5).map((e) {
      e.createdAt = DateTime(2022, 1, 5);
      return e;
    }).toList(),
    '2022-01-10': testAssets.sublist(5, 10).map((e) {
      e.createdAt = DateTime(2022, 1, 10);
      return e;
    }).toList(),
    '2022-02-17': testAssets.sublist(10, 15).map((e) {
      e.createdAt = DateTime(2022, 2, 17);
      return e;
    }).toList(),
    '2022-10-15': testAssets.sublist(15, 30).map((e) {
      e.createdAt = DateTime(2022, 10, 15);
      return e;
    }).toList()
  };

  group('Test grouped', () {
    test('test grouped check months', () async {
      final renderList = await RenderList.fromAssetGroups(groups, 3);

      // Jan
      // Day 1
      // 5 Assets => 2 Rows
      // Day 2
      // 5 Assets => 2 Rows
      // Feb
      // Day 1
      // 5 Assets => 2 Rows
      // Oct
      // Day 1
      // 15 Assets => 5 Rows
      expect(renderList.elements.length, 18);
      expect(
        renderList.elements[0].type,
        RenderAssetGridElementType.monthTitle,
      );
      expect(renderList.elements[0].date.month, 1);
      expect(
        renderList.elements[7].type,
        RenderAssetGridElementType.monthTitle,
      );
      expect(renderList.elements[7].date.month, 2);
      expect(
        renderList.elements[11].type,
        RenderAssetGridElementType.monthTitle,
      );
      expect(renderList.elements[11].date.month, 10);
    });

    test('test grouped check types', () async {
      final renderList = await RenderList.fromAssetGroups(groups, 5);

      // Jan
      // Day 1
      // 5 Assets
      // Day 2
      // 5 Assets
      // Feb
      // Day 1
      // 5 Assets
      // Oct
      // Day 1
      // 15 Assets => 3 Rows

      final types = [
        RenderAssetGridElementType.monthTitle,
        RenderAssetGridElementType.dayTitle,
        RenderAssetGridElementType.assetRow,
        RenderAssetGridElementType.dayTitle,
        RenderAssetGridElementType.assetRow,
        RenderAssetGridElementType.monthTitle,
        RenderAssetGridElementType.dayTitle,
        RenderAssetGridElementType.assetRow,
        RenderAssetGridElementType.monthTitle,
        RenderAssetGridElementType.dayTitle,
        RenderAssetGridElementType.assetRow,
        RenderAssetGridElementType.assetRow,
        RenderAssetGridElementType.assetRow
      ];

      expect(renderList.elements.length, types.length);

      for (int i = 0; i < renderList.elements.length; i++) {
        expect(renderList.elements[i].type, types[i]);
      }
    });
  });
}
