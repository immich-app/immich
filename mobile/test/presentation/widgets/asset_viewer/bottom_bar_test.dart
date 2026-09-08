import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:mockito/mockito.dart';

import '../../../mockito_targets.handles.dart';
import '../../../mocks.dart';
import '../../../unit/factories/remote_asset_factory.dart';
import '../../../widget_tester_extensions.dart';

class TestReadOnlyModeNotifier extends ReadOnlyModeNotifier {
  @override
  bool build() => true;
}

void main() {
  testWidgets('player stays bound after local id arrives', (tester) async {
    final searchCopy = RemoteAssetFactory.create(type: .video);
    final mergedCopy = searchCopy.copyWith(localId: 'local-1', isFavorite: true);
    final services = ServiceMocks();
    final controller = NativeVideoPlayerControllerMock();
    final updates = StreamController<BaseAsset?>(sync: true);
    services.asset.watchAsset.mockReturnValue(updates.stream);
    when(controller.mock.play()).thenAnswer((_) async {});
    when(controller.mock.pause()).thenAnswer((_) async {});
    services.timeline.origin.mockReturnValue(.search);

    late WidgetRef ref;

    await tester.pumpConsumerWidget(
      Consumer(
        builder: (context, widgetRef, _) {
          ref = widgetRef;
          return const ViewerBottomBar();
        },
      ),
      overrides: [
        assetServiceProvider.overrideWithValue(services.asset),
        assetsActionProvider(ActionSource.viewer).overrideWithValue(const AssetFilter<BaseAsset>({})),
        gCastServiceProvider.overrideWithValue(services.cast),
        inLockedViewProvider.overrideWithValue(true),
        ownedAssetsActionProvider(ActionSource.viewer).overrideWithValue(const AssetFilter<RemoteAsset>({})),
        readonlyModeProvider.overrideWith(TestReadOnlyModeNotifier.new),
        timelineServiceProvider.overrideWithValue(services.timeline),
      ],
    );

    final viewer = ref.read(assetViewerProvider.notifier);
    viewer.setAsset(searchCopy);
    await tester.pump();
    ref.read(videoPlayerProvider(searchCopy.id).notifier).attachController(controller);
    updates.add(mergedCopy);
    await tester.pump();
    await tester.tap(find.byType(IconButton));
    await tester.pump();

    verify(controller.mock.play()).called(1);
    viewer.setShowingDetails(true);
    await tester.pump();
    verify(controller.mock.pause()).called(1);

    await tester.pumpWidget(const SizedBox.shrink());
    unawaited(updates.close());
  });
}
