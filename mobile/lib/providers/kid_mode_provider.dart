import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'kid_mode_provider.g.dart';

@riverpod
class KidMode extends _$KidMode {
  @override
  bool build() {
    // default to false
    return false;
  }

  void setKidMode(bool isEnabled) {
    state = isEnabled;
  }

  void toggleKidMode() {
    state = !state;
  }
}
