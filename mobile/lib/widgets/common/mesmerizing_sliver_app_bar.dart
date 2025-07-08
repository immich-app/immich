import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class MesmerizingSliverAppBar extends ConsumerWidget {
  const MesmerizingSliverAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineService = ref.watch(timelineServiceProvider);
    final assetCount = timelineService.totalAssets;

    return SliverAppBar(
      expandedHeight: 300.0,
      floating: false,
      pinned: true,
      snap: false,
      elevation: 0,
      flexibleSpace: LayoutBuilder(
        builder: (context, constraints) {
          final settings = context
              .dependOnInheritedWidgetOfExactType<FlexibleSpaceBarSettings>();
          final deltaExtent =
              settings?.maxExtent != null && settings?.minExtent != null
                  ? settings!.maxExtent - settings.minExtent
                  : 0.0;
          final t = deltaExtent > 0.0
              ? (1.0 -
                      (settings!.currentExtent - settings.minExtent) /
                          deltaExtent)
                  .clamp(0.0, 1.0)
              : 1.0;

          return FlexibleSpaceBar(
            centerTitle: true,
            titlePadding: EdgeInsets.lerp(
              const EdgeInsets.only(left: 16, bottom: 16),
              const EdgeInsets.only(left: 0, bottom: 16),
              t,
            ),
            title: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: t > 0.95
                  ? Text(
                      'Favorites',
                      key: const ValueKey('collapsed'),
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
              scrollProgress: t,
            ),
          );
        },
      ),
    );
  }
}

class _ExpandedBackground extends ConsumerWidget {
  final int assetCount;
  final double scrollProgress;

  const _ExpandedBackground({
    required this.assetCount,
    required this.scrollProgress,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineService = ref.watch(timelineServiceProvider);

    return Stack(
      fit: StackFit.expand,
      children: [
        // Random asset background with zooming effect
        Transform.translate(
          offset: Offset(0, scrollProgress * 50),
          child: Transform.scale(
            scale: 1.4 - (scrollProgress * 0.2),
            child: _RandomAssetBackground(timelineService: timelineService),
          ),
        ),

        // Animated gradient overlay
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: Theme.of(context).brightness == Brightness.dark
                  ? [
                      Colors.black
                          .withValues(alpha: 0.1 + (scrollProgress * 0.4)),
                      Colors.black
                          .withValues(alpha: 0.5 + (scrollProgress * 0.3)),
                      Colors.black
                          .withValues(alpha: 0.8 + (scrollProgress * 0.2)),
                    ]
                  : [
                      Colors.transparent, // Clear at the top
                      Colors.transparent, // Keep middle clear
                      Colors.black.withValues(
                        alpha: 0.3 + (scrollProgress * 0.2),
                      ), // Slightly dark at bottom
                    ],
              stops: const [0.0, 0.9, 1.0],
            ),
          ),
        ),

        // Title and count in lower left with fade animation
        Positioned(
          bottom: 16,
          left: 16,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 200),
            opacity: (1.0 - scrollProgress).clamp(0.0, 1.0),
            child: Transform.translate(
              offset: Offset(0, scrollProgress * 30),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Hero(
                    tag: 'favorites_title',
                    child: Material(
                      color: Colors.transparent,
                      child: Text(
                        'Favorites',
                        style: TextStyle(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white
                              : Colors.white,
                          fontSize:
                              (36 - (scrollProgress * 6)).clamp(24.0, 36.0),
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                          shadows: [
                            Shadow(
                              offset: const Offset(0, 2),
                              blurRadius: 12,
                              color: Theme.of(context).brightness ==
                                      Brightness.dark
                                  ? Colors.black54
                                  : Colors.black45,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    child: Text(
                      '$assetCount ${assetCount == 1 ? 'favorite' : 'favorites'}',
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? Colors.white.withValues(alpha: 0.9)
                            : Colors.white.withValues(alpha: 0.95),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 0.2,
                        shadows: [
                          Shadow(
                            offset: const Offset(0, 1),
                            blurRadius: 6,
                            color:
                                Theme.of(context).brightness == Brightness.dark
                                    ? Colors.black45
                                    : Colors.black38,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _RandomAssetBackground extends StatefulWidget {
  final timelineService;

  const _RandomAssetBackground({required this.timelineService});

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
  bool _isFirstLoad = true;

  @override
  void initState() {
    super.initState();

    _zoomController = AnimationController(
      duration: const Duration(seconds: 12), // Slower for more cinematic effect
      vsync: this,
    );

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500), // Faster initial fade
      vsync: this,
    );

    _zoomAnimation = Tween<double>(
      begin: 1.0, // Start from full image
      end: 1.3, // Zoom in gradually
    ).animate(
      CurvedAnimation(
        parent: _zoomController,
        curve: Curves.easeInOut,
      ),
    );

    _panAnimation = Tween<Offset>(
      begin: Offset.zero, // Start centered
      end: const Offset(0.15, -0.1), // Pan to top right corner
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
        curve: Curves.easeOut, // Faster curve for initial load
      ),
    );

    // Start loading immediately without waiting
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRandomAssetFast();
    });

    // Also try a fallback approach
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted && _currentAsset == null) {
        _loadRandomAsset();
      }
    });
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

  Future<void> _loadRandomAssetFast() async {
    // Try to load the first available asset immediately
    try {
      // Check if assets are already available
      // if (widget.timelineService.totalAssets > 0) {
      //   final assets = widget.timelineService.getAssets(0, 1);
      //   if (assets.isNotEmpty && mounted) {
      //     setState(() {
      //       _currentAsset = assets.first;
      //       _isFirstLoad = false;
      //     });
      //     await _fadeController.forward();
      //     _startZoomCycle();
      //     return;
      //   }
      // }

      // If no assets yet, try multiple times with very short delays
      for (int i = 0; i < 20; i++) {
        await Future.delayed(const Duration(milliseconds: 25));
        if (mounted && widget.timelineService.totalAssets > 0) {
          final assets = widget.timelineService.getAssets(0, 1);
          if (assets.isNotEmpty && mounted) {
            setState(() {
              _currentAsset = assets.first;
              _isFirstLoad = false;
            });
            await _fadeController.forward();
            _startZoomCycle();
            return;
          }
        }
      }

      // Fallback: keep trying with regular method
      if (mounted) {
        _loadRandomAsset();
      }
    } catch (e) {
      // Fallback to regular loading on error
      if (mounted) {
        _loadRandomAsset();
      }
    }
  }

  Future<void> _loadRandomAsset() async {
    try {
      if (mounted && widget.timelineService.totalAssets > 0) {
        final randomIndex = _isFirstLoad
            ? 0 // Always load first asset on initial load for speed
            : (widget.timelineService.totalAssets > 1)
                ? DateTime.now().millisecond %
                    widget.timelineService.totalAssets
                : 0;
        final assets = widget.timelineService.getAssets(randomIndex, 1);
        if (assets.isNotEmpty && mounted) {
          setState(() {
            _currentAsset = assets.first;
            _isFirstLoad = false;
          });
          await _fadeController.forward();
          // Only start zoom cycle if not already running
          if (_zoomController.status == AnimationStatus.dismissed) {
            _startZoomCycle();
          }
        }
      }
    } catch (e) {
      // Handle error and retry once
      if (mounted) {
        await Future.delayed(const Duration(milliseconds: 200));
        if (mounted && _currentAsset == null) {
          // Simple retry without recursion
          if (widget.timelineService.totalAssets > 0) {
            final assets = widget.timelineService.getAssets(0, 1);
            if (assets.isNotEmpty && mounted) {
              setState(() {
                _currentAsset = assets.first;
                _isFirstLoad = false;
              });
              _fadeController.forward();
              if (_zoomController.status == AnimationStatus.dismissed) {
                _startZoomCycle();
              }
            }
          }
        }
      }
    }
  }

  Future<void> _loadNextAsset() async {
    if (!mounted) return;

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
        // If only one asset, restart the zoom
        if (mounted) {
          _zoomController.reset();
          _startZoomCycle();
        }
      }
    } catch (e) {
      // Handle error and restart cycle
      if (mounted) {
        _zoomController.reset();
        _startZoomCycle();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.timelineService.totalAssets == 0) {
      final isDark = Theme.of(context).brightness == Brightness.dark;
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    Colors.deepPurple.withValues(alpha: 0.8),
                    Colors.indigo.withValues(alpha: 0.9),
                    Colors.purple.withValues(alpha: 0.8),
                    Colors.pink.withValues(alpha: 0.7),
                  ]
                : [
                    Colors.pink.shade300.withValues(alpha: 0.9),
                    Colors.purple.shade400.withValues(alpha: 0.8),
                    Colors.indigo.shade400.withValues(alpha: 0.9),
                    Colors.blue.shade500.withValues(alpha: 0.8),
                  ],
            stops: const [0.0, 0.3, 0.7, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // Floating elements for visual interest
            Positioned(
              top: 40,
              right: 30,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
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
                  color: isDark
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
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.06)
                      : Colors.white.withValues(alpha: 0.12),
                ),
              ),
            ),
            // Heart icon for empty favorites
            Center(
              child: Icon(
                Icons.favorite_outline,
                size: 100,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.15)
                    : Colors.white.withValues(alpha: 0.25),
              ),
            ),
          ],
        ),
      );
    }

    if (_currentAsset == null) {
      final isDark = Theme.of(context).brightness == Brightness.dark;
      return AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    Colors.deepPurple.withValues(alpha: 0.4),
                    Colors.indigo.withValues(alpha: 0.5),
                    Colors.purple.withValues(alpha: 0.4),
                  ]
                : [
                    Colors.blue.shade200.withValues(alpha: 0.6),
                    Colors.purple.shade300.withValues(alpha: 0.5),
                    Colors.indigo.shade300.withValues(alpha: 0.6),
                  ],
          ),
        ),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                isDark ? Colors.white70 : Colors.white.withValues(alpha: 0.8),
              ),
            ),
          ),
        ),
      );
    }

    return AnimatedBuilder(
      animation:
          Listenable.merge([_zoomAnimation, _panAnimation, _fadeAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(
            _panAnimation.value.dx * 100, // Convert to pixel offset
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
                    // Show a subtle loading state while the full image loads
                    return Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: Theme.of(context).brightness ==
                                  Brightness.dark
                              ? [
                                  Colors.deepPurple.withValues(alpha: 0.3),
                                  Colors.indigo.withValues(alpha: 0.4),
                                  Colors.purple.withValues(alpha: 0.3),
                                ]
                              : [
                                  Colors.blue.shade200.withValues(alpha: 0.5),
                                  Colors.purple.shade300.withValues(alpha: 0.4),
                                  Colors.indigo.shade300.withValues(alpha: 0.5),
                                ],
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback to a gradient if image fails to load
                    return Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: Theme.of(context).brightness ==
                                  Brightness.dark
                              ? [
                                  Colors.deepPurple.withValues(alpha: 0.6),
                                  Colors.indigo.withValues(alpha: 0.7),
                                  Colors.purple.withValues(alpha: 0.6),
                                ]
                              : [
                                  Colors.blue.shade300.withValues(alpha: 0.7),
                                  Colors.purple.shade400.withValues(alpha: 0.6),
                                  Colors.indigo.shade400.withValues(alpha: 0.7),
                                ],
                        ),
                      ),
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
