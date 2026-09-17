import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/sync_status_and_actions.dart';
import 'package:mocktail/mocktail.dart';

import '../../../infrastructure/repository.mock.dart';
import '../../../unit/presentation/presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() => context.dispose());

  testWidgets('keeps the reset button reachable when the counts fail', (tester) async {
    final drift = MockDrift();
    when(() => drift.localAlbumRepository).thenReturn(MockLocalAlbumRepository());
    when(() => drift.memoryRepository).thenReturn(MockMemoryRepository());
    when(() => context.service.asset.service.getAssetCounts()).thenThrow(Exception('corrupt db'));

    await tester.pumpTestWidget(
      context,
      const SyncStatusAndActions(),
      overrides: [driftProvider.overrideWithValue(drift)],
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Error occur, reset the local database by tapping the button below'), findsOneWidget);
    expect(find.text('Reset SQLite Database'), findsOneWidget);
  });
}
