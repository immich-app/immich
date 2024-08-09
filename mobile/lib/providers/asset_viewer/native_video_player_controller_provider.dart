import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:native_video_player/native_video_player.dart';

final nativePlayerControllerProvider =
    StateProvider((ref) => NativeVideoPlayerController(0));
