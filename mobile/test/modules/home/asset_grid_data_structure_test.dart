import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

void main() {
  final List<Asset> testAssets = [];

  for (int i = 0; i < 150; i++) {
    int month = i ~/ 31;
    int day = (i % 31).toInt();

    DateTime date = DateTime(2022, month, day);

    testAssets.add(
      Asset(
        checksum: "",
        localId: '$i',
        ownerId: 1,
        fileCreatedAt: date,
        fileModifiedAt: date,
        updatedAt: date,
        durationInSeconds: 0,
        type: AssetType.image,
        fileName: '',
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
        stackCount: 0,
      ),
    );
  }

  final List<Asset> assets = [];

  assets.addAll(
    testAssets.sublist(0, 5).map((e) {
      e.fileCreatedAt = DateTime(2022, 1, 5);
      return e;
    }).toList(),
  );
  assets.addAll(
    testAssets.sublist(5, 10).map((e) {
      e.fileCreatedAt = DateTime(2022, 1, 10);
      return e;
    }).toList(),
  );
  assets.addAll(
    testAssets.sublist(10, 15).map((e) {
      e.fileCreatedAt = DateTime(2022, 2, 17);
      return e;
    }).toList(),
  );
  assets.addAll(
    testAssets.sublist(15, 30).map((e) {
      e.fileCreatedAt = DateTime(2022, 10, 15);
      return e;
    }).toList(),
  );

  group('Test grouped', () {
    test('test grouped check months', () async {
      final renderList = await RenderList.fromAssets(
        assets,
        GroupAssetsBy.day,
      );

      // Oct
      // Day 1
      // 15 Assets => 5 Rows
      // Feb
      // Day 1
      // 5 Assets => 2 Rows
      // Jan
      // Day 2
      // 5 Assets => 2 Rows
      // Day 1
      // 5 Assets => 2 Rows
      expect(renderList.elements, hasLength(4));
      expect(
        renderList.elements[0].type,
        RenderAssetGridElementType.monthTitle,
      );
      expect(renderList.elements[0].date.month, 1);
      expect(
        renderList.elements[1].type,
        RenderAssetGridElementType.groupDividerTitle,
      );
      expect(renderList.elements[1].date.month, 1);
      expect(
        renderList.elements[2].type,
        RenderAssetGridElementType.monthTitle,
      );
      expect(renderList.elements[2].date.month, 2);
      expect(
        renderList.elements[3].type,
        RenderAssetGridElementType.monthTitle,
      );
      expect(renderList.elements[3].date.month, 10);
    });

    test('test grouped check types', () async {
      final renderList = await RenderList.fromAssets(
        assets,
        GroupAssetsBy.day,
      );

      // Oct
      // Day 1
      // 15 Assets => 3 Rows
      // Feb
      // Day 1
      // 5 Assets => 1 Row
      // Jan
      // Day 2
      // 5 Assets => 1 Row
      // Day 1
      // 5 Assets => 1 Row
      final types = [
        RenderAssetGridElementType.monthTitle,
        RenderAssetGridElementType.groupDividerTitle,
        RenderAssetGridElementType.monthTitle,
        RenderAssetGridElementType.monthTitle,
      ];

      expect(renderList.elements, hasLength(types.length));

      for (int i = 0; i < renderList.elements.length; i++) {
        expect(renderList.elements[i].type, types[i]);
      }
    });
  });
}
