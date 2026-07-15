import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/platform/app_icon_api.g.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('switches the launcher icon and reports it back', (tester) async {
    final api = AppIconApi();

    await api.setAppIcon('neon');
    expect(await api.getAppIcon(), 'neon');

    await api.setAppIcon('classic');
    expect(await api.getAppIcon(), 'classic');

    await expectLater(api.setAppIcon('not-an-icon'), throwsA(isA<PlatformException>()));
  });
}
