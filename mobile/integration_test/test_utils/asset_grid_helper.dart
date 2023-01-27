import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/thumbnail_image.dart';

import 'general_helper.dart';

class ImmichTestAssetGridHelper {
  final WidgetTester tester;

  ImmichTestAssetGridHelper(this.tester);

  Finder findThumbnailImagesInRow(int index) {
    final rowFinder = find.descendant(
      of: find.byType(ImmichAssetGrid),
      matching: ImmichTestFindUtils.findByWidgetKeyStartsWith("asset-row-"),
    );
    return find.descendant(
      of: rowFinder.at(index),
      matching: find.byType(ThumbnailImage),
    );
  }
}
