import 'package:immich_mobile/providers/server_info.provider.dart';

import '../domain/service.mock.dart';

class FakeServerInfoNotifier extends ServerInfoNotifier {
  FakeServerInfoNotifier({bool trashEnabled = true}) : super(MockServerInfoService()) {
    state = state.copyWith(serverFeatures: state.serverFeatures.copyWith(trash: trashEnabled));
  }
}
