import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_details/technical_details.widget.dart';

import '../../../test_utils.dart';
import '../../../widget_tester_extensions.dart';

void main() {
  testWidgets('shows the original asset path in technical details', (tester) async {
    const originalPath = '/data/library/2025/holiday/photo.jpg';
    final asset = TestUtils.createRemoteAsset(id: 'asset-1');

    await tester.pumpConsumerWidget(TechnicalDetails(asset: asset, originalPath: originalPath));
    await tester.pumpAndSettle();

    expect(find.text(originalPath), findsOneWidget);
  });
}
