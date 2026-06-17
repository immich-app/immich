import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';

final _hlsVideoSessionIdRegex = RegExp(
  r'/video/stream/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/',
);
// For BC if we add an audio endpoint
final _hlsAudioSessionIdRegex = RegExp(
  r'/audio/stream/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/',
);

class NativeVideoViewer extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final String? localFilePath;
  final bool isCurrent;
  final bool showControls;
  final ImageProvider imageProvider;

  const NativeVideoViewer({
    super.key,
    required this.asset,
    this.localFilePath,
    required this.imageProvider,
    this.isCurrent = false,
    this.showControls = true,
  });

  @override
  ConsumerState<NativeVideoViewer> createState() => _NativeVideoViewerState();
}

class _NativeVideoViewerState extends ConsumerState<NativeVideoViewer> with WidgetsBindingObserver {
  static final _log = Logger('NativeVideoViewer');

  NativeVideoPlayerController? _controller;
  late final Future<VideoSource?> _videoSource;
  Timer? _loadTimer;
  bool _isVideoReady = false;
  bool _shouldPlayOnForeground = true;
  String? _remoteAssetId;

  VideoPlayerNotifier get _notifier => ref.read(videoPlayerProvider(widget.asset.heroTag).notifier);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _videoSource = _createSource();
  }

  @override
  void didUpdateWidget(NativeVideoViewer oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.isCurrent == oldWidget.isCurrent || _controller == null) {
      return;
    }

    if (!widget.isCurrent) {
      _loadTimer?.cancel();
      _notifier.pause();
      _notifier.endHlsSession();
      return;
    }

    if (ref.read(serverInfoProvider).serverFeatures.realtimeTranscoding) {
      _loadVideo();
    } else {
      // Prevent unnecessary loading when swiping between assets.
      _loadTimer = Timer(const Duration(milliseconds: 200), _loadVideo);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _loadTimer?.cancel();
    _removeListeners();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    switch (state) {
      case AppLifecycleState.resumed:
        if (_shouldPlayOnForeground) {
          await _notifier.play();
        }
      case AppLifecycleState.paused:
        _shouldPlayOnForeground = await _controller?.isPlaying() ?? true;
        if (_shouldPlayOnForeground) {
          await _notifier.pause();
        }
      default:
    }
  }

  Future<VideoSource?> _createSource() async {
    if (!mounted) {
      return null;
    }

    final videoAsset = await ref.read(assetServiceProvider).getAsset(widget.asset) ?? widget.asset;
    if (!mounted) {
      return null;
    }

    try {
      final localFilePath = widget.localFilePath;
      if (localFilePath != null) {
        final file = File(localFilePath);
        if (!await file.exists()) {
          throw Exception('No file found for the video');
        }

        return VideoSource.init(
          path: CurrentPlatform.isAndroid ? file.uri.toString() : file.path,
          type: VideoSourceType.file,
        );
      }

      if (videoAsset.hasLocal && videoAsset.livePhotoVideoId == null) {
        final id = videoAsset is LocalAsset ? videoAsset.id : (videoAsset as RemoteAsset).localId!;
        final file = await StorageRepository().getFileForAsset(id);
        if (!mounted) {
          return null;
        }

        if (file == null) {
          throw Exception('No file found for the video');
        }

        // Pass a file:// URI so Android's Uri.parse doesn't
        // interpret characters like '#' as fragment identifiers.
        return VideoSource.init(
          path: CurrentPlatform.isAndroid ? file.uri.toString() : file.path,
          type: VideoSourceType.file,
        );
      }

      final isOriginalVideo = ref.read(appConfigProvider).viewer.loadOriginalVideo;
      final realtimeTranscoding = ref.read(serverInfoProvider).serverFeatures.realtimeTranscoding;
      // Motion photo clips are short, so spinning up a transcoding session for them is wasteful
      final useHls = !isOriginalVideo && videoAsset.livePhotoVideoId == null && realtimeTranscoding;
      final remoteId = (videoAsset as RemoteAsset).id;
      final serverEndpoint = Store.get(StoreKey.serverEndpoint);
      final String videoUrl;
      if (useHls) {
        videoUrl = '$serverEndpoint/assets/$remoteId/video/stream/main.m3u8';
      } else {
        final String postfixUrl = isOriginalVideo ? 'original' : 'video/playback';
        videoUrl = videoAsset.livePhotoVideoId != null
            ? '$serverEndpoint/assets/${videoAsset.livePhotoVideoId}/$postfixUrl'
            : '$serverEndpoint/assets/$remoteId/$postfixUrl';
      }
      _remoteAssetId = remoteId;

      return VideoSource.init(path: videoUrl, type: VideoSourceType.network, headers: ApiService.getRequestHeaders());
    } catch (error) {
      _log.severe('Error creating video source for asset ${videoAsset.name}: $error');
      return null;
    }
  }

  void _onPlaybackReady() async {
    if (!mounted || !widget.isCurrent) {
      return;
    }

    _notifier.onNativePlaybackReady();

    // onPlaybackReady may be called multiple times, usually when more data
    // loads. If this is not the first time that the player has become ready, we
    // should not autoplay.
    if (_isVideoReady) {
      return;
    }

    setState(() => _isVideoReady = true);

    if (ref.read(assetViewerProvider).showingDetails) {
      return;
    }

    final autoPlayVideo = ref.read(appConfigProvider).viewer.autoPlayVideo;
    if (autoPlayVideo || widget.asset.isMotionPhoto) {
      await _notifier.play();
    }
  }

  void _onPlaybackEnded() {
    if (!mounted) {
      return;
    }

    _notifier.onNativePlaybackEnded();

    if (_controller?.playbackInfo?.status == PlaybackStatus.stopped) {
      ref.read(isPlayingMotionVideoProvider.notifier).playing = false;
    }
  }

  void _onPlaybackPositionChanged() {
    if (!mounted) {
      return;
    }
    _notifier.onNativePositionChanged();
  }

  void _onPlaybackStatusChanged() {
    if (!mounted) {
      return;
    }
    _notifier.onNativeStatusChanged();
  }

  void _onSourceResolved() {
    final url = _controller?.onPlaybackSourceResolved.value;
    _notifier.updateHlsSession(assetId: _remoteAssetId, sessionId: url == null ? null : _extractHlsSessionId(url));
  }

  void _removeListeners() {
    _controller?.onPlaybackPositionChanged.removeListener(_onPlaybackPositionChanged);
    _controller?.onPlaybackStatusChanged.removeListener(_onPlaybackStatusChanged);
    _controller?.onPlaybackReady.removeListener(_onPlaybackReady);
    _controller?.onPlaybackEnded.removeListener(_onPlaybackEnded);
    _controller?.onPlaybackSourceResolved.removeListener(_onSourceResolved);
  }

  void _loadVideo() async {
    final nc = _controller;
    if (nc == null || nc.videoSource != null || !mounted) {
      return;
    }

    final source = await _videoSource;
    if (source == null || !mounted) {
      return;
    }

    await _notifier.load(source);
    final loopVideo = ref.read(appConfigProvider).viewer.loopVideo;
    await _notifier.setLoop(!widget.asset.isMotionPhoto && loopVideo);
    await _notifier.setVolume(1);
  }

  void _initController(NativeVideoPlayerController nc) {
    if (_controller != null || !mounted) {
      return;
    }

    _notifier.attachController(nc);

    nc.onPlaybackPositionChanged.addListener(_onPlaybackPositionChanged);
    nc.onPlaybackStatusChanged.addListener(_onPlaybackStatusChanged);
    nc.onPlaybackReady.addListener(_onPlaybackReady);
    nc.onPlaybackEnded.addListener(_onPlaybackEnded);
    nc.onPlaybackSourceResolved.addListener(_onSourceResolved);

    _controller = nc;

    if (widget.isCurrent) {
      _loadVideo();
    }
  }

  /// Extracts the HLS session id from a resolved playlist or segment URL,
  /// e.g. `https://host/api/assets/{id}/video/stream/{sessionId}/0/playlist.m3u8`.
  String? _extractHlsSessionId(String url) =>
      _hlsVideoSessionIdRegex.firstMatch(url)?.group(1) ?? _hlsAudioSessionIdRegex.firstMatch(url)?.group(1);

  @override
  Widget build(BuildContext context) {
    final image = Image(image: widget.imageProvider, fit: BoxFit.contain, alignment: Alignment.center);
    if (ref.watch(castProvider.select((c) => c.isCasting))) {
      return IgnorePointer(child: Center(child: image));
    }

    final status = ref.watch(videoPlayerProvider(widget.asset.heroTag).select((v) => v.status));
    return IgnorePointer(
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // The engine snaps the video platform view to the device-pixel grid; snap the
          // placeholder the same way so it doesn't show a hairline past the video's edge.
          _DevicePixelSnap(devicePixelRatio: MediaQuery.devicePixelRatioOf(context), child: image),
          Visibility.maintain(
            visible: _isVideoReady,
            child: NativeVideoPlayerView(onViewReady: _initController),
          ),
          if (status == VideoPlaybackStatus.buffering) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}

class _DevicePixelSnap extends SingleChildRenderObjectWidget {
  final double devicePixelRatio;

  const _DevicePixelSnap({required this.devicePixelRatio, required Widget super.child});

  @override
  _RenderDevicePixelSnap createRenderObject(BuildContext context) => _RenderDevicePixelSnap(devicePixelRatio);

  @override
  void updateRenderObject(BuildContext context, _RenderDevicePixelSnap renderObject) {
    renderObject.devicePixelRatio = devicePixelRatio;
  }
}

class _RenderDevicePixelSnap extends RenderShiftedBox {
  _RenderDevicePixelSnap(this._devicePixelRatio) : super(null);

  double _devicePixelRatio;
  set devicePixelRatio(double value) {
    if (_devicePixelRatio == value) {
      return;
    }
    _devicePixelRatio = value;
    markNeedsLayout();
  }

  /// The largest device-pixel-aligned extent that still tucks under the platform view.
  double _snap(double extent) {
    final scaled = extent * _devicePixelRatio;
    final floored = scaled.floorToDouble();
    if (floored == scaled) {
      return extent;
    }
    final pixels = floored - 1;
    return pixels <= 0 ? extent : pixels / _devicePixelRatio;
  }

  @override
  Size computeDryLayout(BoxConstraints constraints) => constraints.biggest;

  @override
  void performLayout() {
    size = constraints.biggest;
    final child = this.child;
    if (child == null) {
      return;
    }
    child.layout(BoxConstraints.tight(Size(_snap(size.width), _snap(size.height))));
    (child.parentData! as BoxParentData).offset = Offset.zero;
  }
}
