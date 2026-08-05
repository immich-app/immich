import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_controls.dart';

import '../../service.mocks.dart';
import '../../unit/factories/remote_asset_factory.dart';
import '../../widget_tester_extensions.dart';

class _SeededPlayer extends VideoPlayerNotifier {
  _SeededPlayer(VideoPlayerState seed) {
    state = seed;
  }
}

void main() {
  const playing = VideoPlayerState(
    position: Duration(seconds: 6),
    duration: Duration(seconds: 12),
    status: VideoPlaybackStatus.playing,
  );
  const idle = VideoPlayerState(position: Duration.zero, duration: Duration.zero, status: VideoPlaybackStatus.paused);

  testWidgets('stays on the same player when the DB copy replaces the asset', (tester) async {
    // A video opened from search arrives with localId null, then the viewer watches the DB
    // copy which fills it in. The controls have to keep reading the player they started on.
    final searchCopy = RemoteAssetFactory.create(id: 'asset-1', type: .video);
    final mergedCopy = searchCopy.copyWith(localId: 'local-1');
    final boundKey = searchCopy.playerKey;

    expect(searchCopy.heroTag, isNot(mergedCopy.heroTag));

    var asset = searchCopy;
    late StateSetter setHostState;

    await tester.pumpConsumerWidget(
      StatefulBuilder(
        builder: (_, setState) {
          setHostState = setState;
          return VideoControls(asset: asset);
        },
      ),
      overrides: [
        gCastServiceProvider.overrideWithValue(MockGCastService()),
        videoPlayerProvider.overrideWith((ref, key) => _SeededPlayer(key == boundKey ? playing : idle)),
      ],
    );

    expect(find.text('00:06 / 00:12'), findsOne);

    setHostState(() => asset = mergedCopy);
    await tester.pump();

    expect(find.text('00:06 / 00:12'), findsOne);
  });
}
