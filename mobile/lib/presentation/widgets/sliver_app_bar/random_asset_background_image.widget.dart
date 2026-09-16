import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/progressive_image.widget.dart';

/// Randomly selects an asset from the provided [TimelineService] for a persistent Ken Burns zoom
class RandomAssetBackgroundImage extends StatefulWidget {
  final TimelineService timelineService;

  const RandomAssetBackgroundImage({super.key, required this.timelineService});

  @override
  State<RandomAssetBackgroundImage> createState() => _RandomAssetBackgroundImageState();
}

class _RandomAssetBackgroundImageState extends State<RandomAssetBackgroundImage> with TickerProviderStateMixin {
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
      unawaited(
        _zoomController.forward().then((_) {
          unawaited(_loadNextAsset());
        }),
      );
    } else {
      unawaited(
        _zoomController.reverse().then((_) {
          unawaited(_loadNextAsset());
        }),
      );
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
          child: Transform.translate(
            offset: _panAnimation.value,
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
                      child: ProgressiveImage(
                        provider: getFullImageProvider(_currentAsset!),
                        builder: (context, provider) => Image(
                          alignment: Alignment.topRight,
                          image: provider,
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
                  ),

                if (_nextAsset != null)
                  Opacity(
                    opacity: 1.0 - _crossFadeAnimation.value,
                    child: SizedBox(
                      width: double.infinity,
                      height: double.infinity,
                      child: ProgressiveImage(
                        provider: getFullImageProvider(_nextAsset!),
                        builder: (context, provider) => Image(
                          alignment: Alignment.topRight,
                          image: provider,
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
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
