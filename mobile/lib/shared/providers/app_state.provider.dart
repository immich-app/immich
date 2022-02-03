import 'package:hooks_riverpod/hooks_riverpod.dart';

enum AppStateEnum {
  active,
  inactive,
  paused,
  resumed,
  detached,
}

final appStateProvider = StateProvider<AppStateEnum>((ref) {
  return AppStateEnum.active;
});
