import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class MesmerizingSliverAppBar extends ConsumerWidget {
  const MesmerizingSliverAppBar({
    super.key,
    required this.title,
    this.icon = Icons.camera,
  });

  final String title;
  final IconData icon;

  double _calculateScrollProgress(FlexibleSpaceBarSettings? settings) {
    if (settings?.maxExtent == null || settings?.minExtent == null) {
      return 1.0;
    }

    final deltaExtent = settings!.maxExtent - settings.minExtent;
    if (deltaExtent <= 0.0) {
      return 1.0;
    }

    return (1.0 - (settings.currentExtent - settings.minExtent) / deltaExtent)
        .clamp(0.0, 1.0);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineService = ref.watch(timelineServiceProvider);
    final assetCount = timelineService.totalAssets;
    final isMultiSelectEnabled =
        ref.watch(multiSelectProvider.select((s) => s.isEnabled));
    return SliverAnimatedOpacity(
      duration: Durations.medium1,
      opacity: isMultiSelectEnabled ? 0 : 1,
      sliver: SliverAppBar(
        expandedHeight: 300.0,
        floating: false,
        pinned: true,
        snap: false,
        elevation: 0,
        flexibleSpace: LayoutBuilder(
          builder: (context, constraints) {
            final settings = context
                .dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
            final scrollProgress = _calculateScrollProgress(settings);

            return FlexibleSpaceBar(
              centerTitle: true,
              title: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: scrollProgress > 0.95
                    ? Text(
                        title,
                        style: TextStyle(
                          color: context.primaryColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 18,
                        ),
                      )
                    : null,
              ),
              background: _ExpandedBackground(
                assetCount: assetCount,
                scrollProgress: scrollProgress,
                title: title,
                icon: icon,
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ExpandedBackground extends ConsumerWidget {
  final int assetCount;
  final double scrollProgress;
  final String title;
  final IconData icon;

  const _ExpandedBackground({
    required this.assetCount,
    required this.scrollProgress,
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineService = ref.watch(timelineServiceProvider);

    return Stack(
      fit: StackFit.expand,
      children: [
        Transform.translate(
          offset: Offset(0, scrollProgress * 50),
          child: Transform.scale(
            scale: 1.4 - (scrollProgress * 0.2),
            child: _RandomAssetBackground(
              timelineService: timelineService,
              icon: icon,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                Colors.transparent,
                Colors.black.withValues(
                  alpha: 0.3 + (scrollProgress * 0.2),
                ),
              ],
              stops: const [0.0, 0.7, 1.0],
            ),
          ),
        ),
        Positioned(
          bottom: 16,
          left: 16,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                  shadows: [
                    Shadow(
                      offset: Offset(0, 2),
                      blurRadius: 12,
                      color: Colors.black45,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                child: Text(
                  'items_count'.t(
                    context: context,
                    args: {"count": assetCount},
                  ),
                  style: context.textTheme.labelLarge?.copyWith(
                    letterSpacing: 0.2,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    shadows: [
                      const Shadow(
                        offset: Offset(0, 1),
                        blurRadius: 6,
                        color: Colors.black45,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RandomAssetBackground extends StatefulWidget {
  final TimelineService timelineService;
  final IconData icon;

  const _RandomAssetBackground({
    required this.timelineService,
    required this.icon,
  });

  @override
  State<_RandomAssetBackground> createState() => _RandomAssetBackgroundState();
}

class _RandomAssetBackgroundState extends State<_RandomAssetBackground>
    with TickerProviderStateMixin {
  late AnimationController _zoomController;
  late AnimationController _fadeController;
  late Animation<double> _zoomAnimation;
  late Animation<Offset> _panAnimation;
  late Animation<double> _fadeAnimation;
  BaseAsset? _currentAsset;
  BaseAsset? _nextAsset;

  final LinearGradient gradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Colors.pink.shade300.withValues(alpha: 0.9),
      Colors.purple.shade400.withValues(alpha: 0.8),
      Colors.indigo.shade400.withValues(alpha: 0.9),
      Colors.blue.shade500.withValues(alpha: 0.8),
    ],
    stops: const [0.0, 0.3, 0.7, 1.0],
  );

  @override
  void initState() {
    super.initState();

    _zoomController = AnimationController(
      duration: const Duration(seconds: 12),
      vsync: this,
    );

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _zoomAnimation = Tween<double>(
      begin: 1.0,
      end: 1.3,
    ).animate(
      CurvedAnimation(
        parent: _zoomController,
        curve: Curves.easeInOut,
      ),
    );

    _panAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0.15, -0.1),
    ).animate(
      CurvedAnimation(
        parent: _zoomController,
        curve: Curves.easeInOut,
      ),
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _fadeController,
        curve: Curves.easeOut,
      ),
    );

    Future.delayed(
      Durations.medium1,
      () => _loadRandomAsset(),
    );
  }

  @override
  void dispose() {
    _zoomController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _startZoomCycle() {
    _zoomController.forward().then((_) {
      if (mounted) {
        _loadNextAsset();
      }
    });
  }

  Future<void> _loadRandomAsset() async {
    if (!mounted) {
      return;
    }

    if (widget.timelineService.totalAssets == 0) {
      setState(() {
        _currentAsset = null;
      });

      return;
    }

    final randomIndex = (widget.timelineService.totalAssets > 1)
        ? DateTime.now().millisecond % widget.timelineService.totalAssets
        : 0;

    final assets = widget.timelineService.getAssets(randomIndex, 1);

    if (assets.isEmpty) {
      return;
    }

    setState(() {
      _currentAsset = assets.first;
    });

    await _fadeController.forward();
    if (_zoomController.status == AnimationStatus.dismissed) {
      _startZoomCycle();
    }
  }

  Future<void> _loadNextAsset() async {
    if (!mounted) {
      return;
    }

    try {
      if (widget.timelineService.totalAssets > 1) {
        final randomIndex =
            DateTime.now().millisecond % widget.timelineService.totalAssets;
        final assets = widget.timelineService.getAssets(randomIndex, 1);
        if (assets.isNotEmpty && mounted) {
          setState(() {
            _nextAsset = assets.first;
          });

          await _fadeController.reverse();

          if (mounted) {
            setState(() {
              _currentAsset = _nextAsset;
              _nextAsset = null;
            });

            _zoomController.reset();
            await _fadeController.forward();
            _startZoomCycle();
          }
        }
      } else {
        _zoomController.reset();
        _startZoomCycle();
      }
    } catch (e) {
      _zoomController.reset();
      _startZoomCycle();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.timelineService.totalAssets == 0) {
      return _EmptyPageExtendedBackground(
        gradient: gradient,
        icon: widget.icon,
      );
    }

    if (_currentAsset == null) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation:
          Listenable.merge([_zoomAnimation, _panAnimation, _fadeAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(
            _panAnimation.value.dx * 100,
            _panAnimation.value.dy * 100,
          ),
          child: Transform.scale(
            scale: _zoomAnimation.value,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SizedBox(
                width: double.infinity,
                height: double.infinity,
                child: Image(
                  image: getFullImageProvider(_currentAsset!),
                  fit: BoxFit.cover,
                  frameBuilder:
                      (context, child, frame, wasSynchronouslyLoaded) {
                    if (wasSynchronouslyLoaded || frame != null) {
                      return child;
                    }

                    return Container(
                      decoration: BoxDecoration(gradient: gradient),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      decoration: BoxDecoration(gradient: gradient),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _EmptyPageExtendedBackground extends StatelessWidget {
  const _EmptyPageExtendedBackground({
    required this.gradient,
    required this.icon,
  });

  final LinearGradient gradient;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(gradient: gradient),
      child: Stack(
        children: [
          Positioned(
            top: 40,
            right: 30,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.isDarkTheme
                    ? Colors.white.withValues(alpha: 0.1)
                    : Colors.white.withValues(alpha: 0.2),
              ),
            ),
          ),
          Positioned(
            bottom: 100,
            left: 50,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.isDarkTheme
                    ? Colors.white.withValues(alpha: 0.08)
                    : Colors.white.withValues(alpha: 0.15),
              ),
            ),
          ),
          Positioned(
            top: 120,
            left: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: context.isDarkTheme
                    ? Colors.white.withValues(alpha: 0.06)
                    : Colors.white.withValues(alpha: 0.12),
              ),
            ),
          ),
          Center(
            child: Icon(
              icon,
              size: 100,
              color: context.isDarkTheme
                  ? Colors.white.withValues(alpha: 0.15)
                  : Colors.white.withValues(alpha: 0.25),
            ),
          ),
        ],
      ),
    );
  }
}
