import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/remote_album_shared_user_icons.dart';

class RemoteAlbumSliverAppBar extends ConsumerStatefulWidget {
  const RemoteAlbumSliverAppBar({
    super.key,
    this.icon = Icons.camera,
    this.onShowOptions,
    this.onToggleAlbumOrder,
    this.onEditTitle,
    this.onActivity,
  });

  final IconData icon;
  final void Function()? onShowOptions;
  final void Function()? onToggleAlbumOrder;
  final void Function()? onEditTitle;
  final void Function()? onActivity;

  @override
  ConsumerState<RemoteAlbumSliverAppBar> createState() => _MesmerizingSliverAppBarState();
}

class _MesmerizingSliverAppBarState extends ConsumerState<RemoteAlbumSliverAppBar> {
  double _scrollProgress = 0.0;

  double _calculateScrollProgress(FlexibleSpaceBarSettings? settings) {
    if (settings?.maxExtent == null || settings?.minExtent == null) {
      return 1.0;
    }

    final deltaExtent = settings!.maxExtent - settings.minExtent;
    if (deltaExtent <= 0.0) {
      return 1.0;
    }

    return (1.0 - (settings.currentExtent - settings.minExtent) / deltaExtent).clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context) {
    final isMultiSelectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));

    final currentAlbum = ref.watch(currentRemoteAlbumProvider);
    if (currentAlbum == null) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    Color? actionIconColor = Color.lerp(Colors.white, context.primaryColor, _scrollProgress);

    List<Shadow> actionIconShadows = [
      if (_scrollProgress < 0.95)
        Shadow(offset: const Offset(0, 2), blurRadius: 5, color: Colors.black.withValues(alpha: 0.5))
      else
        const Shadow(offset: Offset(0, 2), blurRadius: 0, color: Colors.transparent),
    ];

    return SliverAppBar(
      expandedHeight: 400.0,
      floating: false,
      pinned: true,
      snap: false,
      elevation: 0,
      leading: isMultiSelectEnabled
          ? const SizedBox.shrink()
          : IconButton(
              icon: Icon(
                Platform.isIOS ? Icons.arrow_back_ios_new_rounded : Icons.arrow_back,
                color: actionIconColor,
                shadows: actionIconShadows,
              ),
              onPressed: () => context.navigateTo(const TabShellRoute(children: [DriftAlbumsRoute()])),
            ),
      actions: [
        if (widget.onToggleAlbumOrder != null)
          IconButton(
            icon: Icon(Icons.swap_vert_rounded, color: actionIconColor, shadows: actionIconShadows),
            onPressed: widget.onToggleAlbumOrder,
          ),
        if (currentAlbum.isActivityEnabled && currentAlbum.isShared)
          IconButton(
            icon: Icon(Icons.chat_outlined, color: actionIconColor, shadows: actionIconShadows),
            onPressed: widget.onActivity,
          ),
        if (widget.onShowOptions != null)
          IconButton(
            icon: Icon(Icons.more_vert, color: actionIconColor, shadows: actionIconShadows),
            onPressed: widget.onShowOptions,
          ),
      ],
      title: Builder(
        builder: (context) {
          final settings = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
          final scrollProgress = _calculateScrollProgress(settings);

          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: scrollProgress > 0.95
                ? Text(
                    currentAlbum.name,
                    style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.w600, fontSize: 18),
                  )
                : null,
          );
        },
      ),
      flexibleSpace: Builder(
        builder: (context) {
          final settings = context.dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
          final scrollProgress = _calculateScrollProgress(settings);

          // Update scroll progress for the leading button
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted && _scrollProgress != scrollProgress) {
              setState(() {
                _scrollProgress = scrollProgress;
              });
            }
          });

          return FlexibleSpaceBar(
            background: _ExpandedBackground(
              scrollProgress: scrollProgress,
              icon: widget.icon,
              onEditTitle: widget.onEditTitle,
            ),
          );
        },
      ),
    );
  }
}

class _ExpandedBackground extends ConsumerStatefulWidget {
  final double scrollProgress;
  final IconData icon;
  final void Function()? onEditTitle;

  const _ExpandedBackground({required this.scrollProgress, required this.icon, this.onEditTitle});

  @override
  ConsumerState<_ExpandedBackground> createState() => _ExpandedBackgroundState();
}

class _ExpandedBackgroundState extends ConsumerState<_ExpandedBackground> with SingleTickerProviderStateMixin {
  late AnimationController _slideController;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _slideController = AnimationController(duration: const Duration(milliseconds: 800), vsync: this);

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic));

    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _slideController.forward();
      }
    });
  }

  @override
  void dispose() {
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final timelineService = ref.watch(timelineServiceProvider);
    final currentAlbum = ref.watch(currentRemoteAlbumProvider);

    if (currentAlbum == null) {
      return const SizedBox.shrink();
    }

    final dateRange = ref.watch(remoteAlbumDateRangeProvider(currentAlbum.id));
    return Stack(
      fit: StackFit.expand,
      children: [
        Transform.translate(
          offset: Offset(0, widget.scrollProgress * 50),
          child: Transform.scale(
            scale: 1.4 - (widget.scrollProgress * 0.2),
            child: _RandomAssetBackground(timelineService: timelineService, icon: widget.icon),
          ),
        ),
        ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: widget.scrollProgress * 2.0, sigmaY: widget.scrollProgress * 2.0),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.05),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.3),
                    Colors.black.withValues(alpha: 0.6 + (widget.scrollProgress * 0.25)),
                  ],
                  stops: const [0.0, 0.15, 0.55, 1.0],
                ),
              ),
            ),
          ),
        ),
        Positioned(
          bottom: 16,
          left: 16,
          right: 16,
          child: SlideTransition(
            position: _slideAnimation,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    if (dateRange.hasValue)
                      Text(
                        DateRangeFormatting.formatDateRange(
                          dateRange.value!.$1.toLocal(),
                          dateRange.value!.$2.toLocal(),
                          context.locale,
                        ),
                        style: const TextStyle(
                          color: Colors.white,
                          shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black87)],
                        ),
                      ),
                    const Text(
                      " • ",
                      style: TextStyle(
                        color: Colors.white,
                        shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black87)],
                      ),
                    ),
                    AnimatedContainer(duration: const Duration(milliseconds: 300), child: const _ItemCountText()),
                  ],
                ),
                GestureDetector(
                  onTap: widget.onEditTitle,
                  child: SizedBox(
                    width: double.infinity,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Text(
                        currentAlbum.name,
                        maxLines: 1,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                          shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black54)],
                        ),
                      ),
                    ),
                  ),
                ),
                if (currentAlbum.description.isNotEmpty)
                  GestureDetector(
                    onTap: widget.onEditTitle,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 80),
                      child: SingleChildScrollView(
                        child: Text(
                          currentAlbum.description,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            shadows: [Shadow(offset: Offset(0, 2), blurRadius: 8, color: Colors.black54)],
                          ),
                        ),
                      ),
                    ),
                  ),
                const Padding(padding: EdgeInsets.only(top: 8.0), child: RemoteAlbumSharedUserIcons()),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ItemCountText extends ConsumerStatefulWidget {
  const _ItemCountText();

  @override
  ConsumerState<_ItemCountText> createState() => _ItemCountTextState();
}

class _ItemCountTextState extends ConsumerState<_ItemCountText> {
  StreamSubscription? _reloadSubscription;

  @override
  void initState() {
    super.initState();
    _reloadSubscription = EventStream.shared.listen<TimelineReloadEvent>((_) => setState(() {}));
  }

  @override
  void dispose() {
    _reloadSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assetCount = ref.watch(timelineServiceProvider.select((s) => s.totalAssets));

    return Text(
      'items_count'.t(context: context, args: {"count": assetCount}),
      style: context.textTheme.labelLarge?.copyWith(
        color: Colors.white,
        shadows: [const Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black87)],
      ),
    );
  }
}

class _RandomAssetBackground extends StatefulWidget {
  final TimelineService timelineService;
  final IconData icon;

  const _RandomAssetBackground({required this.timelineService, required this.icon});

  @override
  State<_RandomAssetBackground> createState() => _RandomAssetBackgroundState();
}

class _RandomAssetBackgroundState extends State<_RandomAssetBackground> with TickerProviderStateMixin {
  late AnimationController _zoomController;
  late AnimationController _crossFadeController;
  late Animation<double> _zoomAnimation;
  late Animation<Offset> _panAnimation;
  late Animation<double> _crossFadeAnimation;
  BaseAsset? _currentAsset;
  BaseAsset? _nextAsset;
  bool _isZoomingIn = true;

  @override
  void initState() {
    super.initState();

    _zoomController = AnimationController(
      duration: const Duration(seconds: 12),
      vsync: this,
      animationBehavior: AnimationBehavior.preserve,
    );

    _crossFadeController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
      animationBehavior: AnimationBehavior.preserve,
    );

    _zoomAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(parent: _zoomController, curve: Curves.easeInOut));

    _panAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0.5, -0.5),
    ).animate(CurvedAnimation(parent: _zoomController, curve: Curves.easeInOut));

    _crossFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _crossFadeController, curve: Curves.easeInOutCubic));

    Future.delayed(Durations.medium1, () => _loadFirstAsset());
  }

  @override
  void dispose() {
    _zoomController.dispose();
    _crossFadeController.dispose();
    super.dispose();
  }

  void _startAnimationCycle() {
    if (_isZoomingIn) {
      _zoomController.forward().then((_) {
        _loadNextAsset();
      });
    } else {
      _zoomController.reverse().then((_) {
        _loadNextAsset();
      });
    }
  }

  Future<void> _loadFirstAsset() async {
    if (!mounted) {
      return;
    }

    if (widget.timelineService.totalAssets == 0) {
      setState(() {
        _currentAsset = null;
      });

      return;
    }

    setState(() {
      _currentAsset = widget.timelineService.getRandomAsset();
    });

    await _crossFadeController.forward();

    if (_zoomController.status == AnimationStatus.dismissed) {
      if (_isZoomingIn) {
        _zoomController.reset();
      } else {
        _zoomController.value = 1.0;
      }
      _startAnimationCycle();
    }
  }

  Future<void> _loadNextAsset() async {
    if (!mounted) {
      return;
    }

    try {
      if (widget.timelineService.totalAssets > 1) {
        // Load next asset while keeping current one visible
        final nextAsset = widget.timelineService.getRandomAsset();

        setState(() {
          _nextAsset = nextAsset;
        });

        await _crossFadeController.reverse();
        setState(() {
          _currentAsset = _nextAsset;
          _nextAsset = null;
        });

        _crossFadeController.value = 1.0;

        _isZoomingIn = !_isZoomingIn;

        _startAnimationCycle();
      }
    } catch (e) {
      _zoomController.reset();
      _startAnimationCycle();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.timelineService.totalAssets == 0) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: Listenable.merge([_zoomAnimation, _panAnimation, _crossFadeAnimation]),
      builder: (context, child) {
        return Transform.scale(
          scale: _zoomAnimation.value,
          filterQuality: Platform.isAndroid ? FilterQuality.low : null,
          child: Transform.translate(
            offset: _panAnimation.value,
            filterQuality: Platform.isAndroid ? FilterQuality.low : null,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Current image
                if (_currentAsset != null)
                  Opacity(
                    opacity: _crossFadeAnimation.value,
                    child: SizedBox(
                      width: double.infinity,
                      height: double.infinity,
                      child: Image(
                        alignment: Alignment.topRight,
                        image: getFullImageProvider(_currentAsset!),
                        fit: BoxFit.cover,
                        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
                          if (wasSynchronouslyLoaded || frame != null) {
                            return child;
                          }
                          return Container();
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return SizedBox(
                            width: double.infinity,
                            height: double.infinity,
                            child: Icon(Icons.error_outline_rounded, size: 24, color: Colors.red[300]),
                          );
                        },
                      ),
                    ),
                  ),

                if (_nextAsset != null)
                  Opacity(
                    opacity: 1.0 - _crossFadeAnimation.value,
                    child: SizedBox(
                      width: double.infinity,
                      height: double.infinity,
                      child: Image(
                        alignment: Alignment.topRight,
                        image: getFullImageProvider(_nextAsset!),
                        fit: BoxFit.cover,
                        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
                          if (wasSynchronouslyLoaded || frame != null) {
                            return child;
                          }
                          return const SizedBox.shrink();
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return SizedBox(
                            width: double.infinity,
                            height: double.infinity,
                            child: Icon(Icons.error_outline_rounded, size: 24, color: Colors.red[300]),
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
