import 'dart:ui';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/system_occlusions_api.g.dart';

final systemOcclusionsProvider = NotifierProvider<SystemOcclusionsNotifier, List<Rect>>(SystemOcclusionsNotifier.new);

class SystemOcclusionsNotifier extends Notifier<List<Rect>> implements SystemOcclusionsFlutterApi {
  @override
  List<Rect> build() {
    SystemOcclusionsFlutterApi.setUp(this);

    ref.onDispose(() => SystemOcclusionsFlutterApi.setUp(null));

    return const [];
  }

  @override
  void onChanged(List<OcclusionRect> occlusions) {
    state = [
      for (final occlusion in occlusions)
        Rect.fromLTRB(occlusion.left, occlusion.top, occlusion.right, occlusion.bottom),
    ];
  }
}
