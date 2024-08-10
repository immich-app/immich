import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset_viewer/native_video_player_controller_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controller_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_player.dart';
import 'package:immich_mobile/widgets/common/delayed_loading_indicator.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class NativeVideoViewerPage extends ConsumerStatefulWidget {
  final Asset asset;
  final Widget? placeholder;

  const NativeVideoViewerPage({
    super.key,
    required this.asset,
    this.placeholder,
  });

  @override
  NativeVideoViewerPageState createState() => NativeVideoViewerPageState();
}

class NativeVideoViewerPageState extends ConsumerState<NativeVideoViewerPage> {
  NativeVideoPlayerController? _controller;

  bool isAutoplayEnabled = false;
  bool isPlaybackLoopEnabled = false;

  double videoWidth = 0;
  double videoHeight = 0;

  Future<void> _initController(NativeVideoPlayerController controller) async {
    _controller = controller;

    _controller?. //
        onPlaybackStatusChanged
        .addListener(_onPlaybackStatusChanged);
    _controller?. //
        onPlaybackPositionChanged
        .addListener(_onPlaybackPositionChanged);
    _controller?. //
        onPlaybackSpeedChanged
        .addListener(_onPlaybackSpeedChanged);
    _controller?. //
        onVolumeChanged
        .addListener(_onPlaybackVolumeChanged);
    _controller?. //
        onPlaybackReady
        .addListener(_onPlaybackReady);
    _controller?. //
        onPlaybackEnded
        .addListener(_onPlaybackEnded);

    await _loadVideoSource();
  }

  Future<void> _loadVideoSource() async {
    final videoSource = await _createVideoSource();
    await _controller?.loadVideoSource(videoSource);
  }

  Future<VideoSource> _createVideoSource() async {
    final file = await widget.asset.local!.file;
    if (file == null) {
      throw Exception('No file found for the video');
    }

    return await VideoSource.init(
      path: file.path,
      type: VideoSourceType.file,
    );
  }

  @override
  void dispose() {
    _controller?. //
        onPlaybackStatusChanged
        .removeListener(_onPlaybackStatusChanged);
    _controller?. //
        onPlaybackPositionChanged
        .removeListener(_onPlaybackPositionChanged);
    _controller?. //
        onPlaybackSpeedChanged
        .removeListener(_onPlaybackSpeedChanged);
    _controller?. //
        onVolumeChanged
        .removeListener(_onPlaybackVolumeChanged);
    _controller?. //
        onPlaybackReady
        .removeListener(_onPlaybackReady);
    _controller?. //
        onPlaybackEnded
        .removeListener(_onPlaybackEnded);
    _controller = null;
    super.dispose();
  }

  void _onPlaybackReady() {
    final videoInfo = _controller?.videoInfo;
    if (videoInfo != null) {
      videoWidth = videoInfo.width.toDouble();
      videoHeight = videoInfo.height.toDouble();
    }
    setState(() {});
    _controller?.play();
  }

  void _onPlaybackStatusChanged() {
    setState(() {});
  }

  void _onPlaybackPositionChanged() {
    setState(() {});
  }

  void _onPlaybackSpeedChanged() {
    setState(() {});
  }

  void _onPlaybackVolumeChanged() {
    setState(() {});
  }

  void _onPlaybackEnded() {
    if (isPlaybackLoopEnabled) {
      _controller?.play();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      onPopInvoked: (pop) {},
      child: SizedBox(
        height: videoHeight,
        width: videoWidth,
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: NativeVideoPlayerView(
            onViewReady: _initController,
          ),
        ),
      ),
    );
  }
  // final Asset asset;
  // final Widget? placeholder;
  // final Duration hideControlsTimer;
  // final bool showControls;
  // final bool showDownloadingIndicator;
  // final bool loopVideo;
}
