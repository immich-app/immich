import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/home/ui/asset_list_v2/asset_grid_data_structure.dart';
import 'package:openapi/api.dart';

void main() {
  final List<AssetResponseDto> testAssets = [];

  for (int i = 0; i < 150; i++) {
    int month = i ~/ 31;
    int day = (i % 31).toInt();

    DateTime date = DateTime(2022, month, day);

    testAssets.add(AssetResponseDto(
      type: AssetTypeEnum.IMAGE,
      id: '$i',
      deviceAssetId: '',
      ownerId: '',
      deviceId: '',
      originalPath: '',
      resizePath: '',
      createdAt: date.toIso8601String(),
      modifiedAt: date.toIso8601String(),
      isFavorite: false,
      mimeType: 'image/jpeg',
      duration: '',
      webpPath: '',
      encodedVideoPath: '',
    ));
  }

  final Map<String, List<AssetResponseDto>> groups = {
    '2022-01-05': testAssets.sublist(0, 5).map((e) {
      e.createdAt = DateTime(2022, 1, 5).toIso8601String();
      return e;
    }).toList(),
    '2022-01-10': testAssets.sublist(5, 10).map((e) {
      e.createdAt = DateTime(2022, 1, 10).toIso8601String();
      return e;
    }).toList(),
    '2022-02-17': testAssets.sublist(10, 15).map((e) {
      e.createdAt = DateTime(2022, 2, 17).toIso8601String();
      return e;
    }).toList(),
    '2022-10-15': testAssets.sublist(15, 30).map((e) {
      e.createdAt = DateTime(2022, 10, 15).toIso8601String();
      return e;
    }).toList()
  };

  group('Asset only list', () {
    test('items < itemsPerRow', () {
      final assets = testAssets.sublist(0, 2);
      final renderList = assetsToRenderList(assets, 3);

      expect(renderList.length, 1);
      expect(renderList[0].assetRow!.assets.length, 2);
    });

    test('items = itemsPerRow', () {
      final assets = testAssets.sublist(0, 3);
      final renderList = assetsToRenderList(assets, 3);

      expect(renderList.length, 1);
      expect(renderList[0].assetRow!.assets.length, 3);
    });

    test('items > itemsPerRow', () {
      final assets = testAssets.sublist(0, 20);
      final renderList = assetsToRenderList(assets, 3);

      expect(renderList.length, 7);
      expect(renderList[6].assetRow!.assets.length, 2);
    });

    test('items > itemsPerRow partition 4', () {
      final assets = testAssets.sublist(0, 21);
      final renderList = assetsToRenderList(assets, 4);

      expect(renderList.length, 6);
      expect(renderList[5].assetRow!.assets.length, 1);
    });

    test('items > itemsPerRow check ids', () {
      final assets = testAssets.sublist(0, 21);
      final renderList = assetsToRenderList(assets, 3);

      expect(renderList.length, 7);
      expect(renderList[6].assetRow!.assets.length, 3);
      expect(renderList[0].assetRow!.assets[0].id, '0');
      expect(renderList[1].assetRow!.assets[1].id, '4');
      expect(renderList[3].assetRow!.assets[2].id, '11');
      expect(renderList[6].assetRow!.assets[2].id, '20');
    });
  });

  group('Test grouped', () {
    test('test grouped check months', () {
      final renderList = assetGroupsToRenderList(groups, 3);

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
      expect(renderList.length, 18);
      expect(renderList[0].type, RenderAssetGridElementType.monthTitle);
      expect(renderList[0].date.month, 1);
      expect(renderList[7].type, RenderAssetGridElementType.monthTitle);
      expect(renderList[7].date.month, 2);
      expect(renderList[11].type, RenderAssetGridElementType.monthTitle);
      expect(renderList[11].date.month, 10);
    });

    test('test grouped check types', () {
      final renderList = assetGroupsToRenderList(groups, 5);

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

      expect(renderList.length, types.length);

      for (int i = 0; i < renderList.length; i++) {
        expect(renderList[i].type, types[i]);
      }
    });
  });
}
