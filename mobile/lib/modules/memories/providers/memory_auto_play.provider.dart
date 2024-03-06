import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'memory_auto_play.provider.g.dart';

@riverpod
class MemoryAutoPlay extends _$MemoryAutoPlay {
  @override
  bool build() {
    return true;
  }

  void toggleAutoPlay() => state = !state;
}
