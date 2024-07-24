import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/map/map_state.model.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:mocktail/mocktail.dart';

class MockMapStateNotifier extends Notifier<MapState>
    with Mock
    implements MapStateNotifier {
  final MapState initState;

  MockMapStateNotifier(this.initState);

  @override
  MapState build() => initState;

  @override
  set state(MapState mapState) => super.state = mapState;
}
