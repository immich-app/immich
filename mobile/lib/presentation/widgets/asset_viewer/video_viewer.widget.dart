import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
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
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';

class NativeVideoViewer extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final String? localFilePath;
  final bool isCurrent;
  final bool showControls;
  final Widget image;

  const NativeVideoViewer({
    super.key,
    required this.asset,
    this.localFilePath,
    required this.image,
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
      return;
    }

    // Prevent unnecessary loading when swiping between assets.
    _loadTimer = Timer(const Duration(milliseconds: 200), _loadVideo);
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

      // Attempt to retrieve LocalAsset, falling back to remote if it cannot be found
      final localAsset = await _localPlaybackAsset(videoAsset);

      if (localAsset != null) {
        final file = localAsset.isMotionPhoto
            ? await StorageRepository().getMotionFileForAsset(localAsset)
            : await StorageRepository().getFileForAsset(localAsset.id);

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

      final remoteAsset = videoAsset as RemoteAsset;

      final serverEndpoint = Store.get(StoreKey.serverEndpoint);
      final isOriginalVideo = ref.read(appConfigProvider).viewer.loadOriginalVideo;
      final String postfixUrl = isOriginalVideo ? 'original' : 'video/playback';
      final String assetId = remoteAsset.livePhotoVideoId ?? remoteAsset.id;
      final String videoUrl = '$serverEndpoint/assets/$assetId/$postfixUrl';

      return VideoSource.init(path: videoUrl, type: VideoSourceType.network, headers: ApiService.getRequestHeaders());
    } catch (error) {
      _log.severe('Error creating video source for asset ${videoAsset.name}: $error');
      return null;
    }
  }

  Future<LocalAsset?> _localPlaybackAsset(BaseAsset baseAsset) async {
    if (!baseAsset.hasLocal) {
      return null;
    }

    LocalAsset? localAsset;

    if (baseAsset is LocalAsset) {
      localAsset = baseAsset;
    } else {
      final localId = (baseAsset as RemoteAsset).localId;
      localAsset = localId != null ? await ref.read(assetServiceProvider).getLocalAsset(localId) : null;
    }

    if (localAsset == null) {
      _log.severe(
        'Invariant violation: asset ${baseAsset.name} (${baseAsset.localId}) is marked `hasLocal` but local asset could not be retrieved',
      );

      return null;
    }

    // Clients (local) may not correctly recognize a given asset as a motion photo. This allows for a scenario where both remote and local
    // have the same asset (hash), but only the remote properly recognizes it as a motion asset
    // If this scenario occurs, fall back to using the remote asset
    if (baseAsset.isMotionPhoto && !localAsset.isMotionPhoto) {
      // Platform mismatch for motion photo, use remote instead
      _log.warning(
        'Mismatched local and remote motion states on ${baseAsset.name} (${baseAsset.localId}), local = ${localAsset.isMotionPhoto}, remote = ${baseAsset.isMotionPhoto}',
      );

      return null;
    }

    return localAsset;
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

  void _removeListeners() {
    _controller?.onPlaybackPositionChanged.removeListener(_onPlaybackPositionChanged);
    _controller?.onPlaybackStatusChanged.removeListener(_onPlaybackStatusChanged);
    _controller?.onPlaybackReady.removeListener(_onPlaybackReady);
    _controller?.onPlaybackEnded.removeListener(_onPlaybackEnded);
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

    _controller = nc;

    if (widget.isCurrent) {
      _loadVideo();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));
    final status = ref.watch(videoPlayerProvider(widget.asset.heroTag).select((v) => v.status));

    return IgnorePointer(
      child: Stack(
        children: [
          if (!_isVideoReady || widget.asset.isMotionPhoto || isCasting) Center(child: widget.image),
          if (!isCasting) ...[
            Visibility.maintain(
              visible: _isVideoReady,
              child: NativeVideoPlayerView(onViewReady: _initController),
            ),
            Center(
              child: AnimatedOpacity(
                opacity: status == VideoPlaybackStatus.buffering ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 400),
                child: const CircularProgressIndicator(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
