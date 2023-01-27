import 'package:flutter_test/flutter_test.dart';
import '../test_utils/general_helper.dart';
import '../test_utils/login_helper.dart';

void main() async {
  await ImmichTestHelper.initialize();

  group("Asset grid tests", () {
    immichWidgetTest("Test initial 4 images per row", (tester, helper) async {
      await helper.loginHelper.loginTo(LoginCredentials.testInstance);

      expect(
        helper.assetGridHelper.findThumbnailImagesInRow(0),
        findsNWidgets(4),
      );
    });
  });
}
