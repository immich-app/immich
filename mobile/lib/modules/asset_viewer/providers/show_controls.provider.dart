import 'package:hooks_riverpod/hooks_riverpod.dart';

final showControlsProvider = StateNotifierProvider<ShowControls, bool>((ref) {
  return ShowControls(ref);
});

class ShowControls extends StateNotifier<bool> {
  ShowControls(this.ref) : super(true);

  final Ref ref;

  bool get show => state;

  set show(bool value) {
    state = value;
  }

  void toggle() {
    state = !state;
  }
}
