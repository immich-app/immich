import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Whether to display the video part of a motion photo
final isSearchingProvider = StateNotifierProvider<IsSearching, bool>((ref) {
  return IsSearching(ref);
});

class IsSearching extends StateNotifier<bool> {
  IsSearching(this.ref) : super(false);

  final Ref ref;

  bool get value => state;

  set value(bool value) {
    state = value;
  }

  void toggle() {
    state = !state;
  }
}
