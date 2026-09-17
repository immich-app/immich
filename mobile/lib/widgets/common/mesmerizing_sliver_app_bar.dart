import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/sliver_app_bar/item_count_text.widget.dart';
import 'package:immich_mobile/presentation/widgets/sliver_app_bar/random_asset_background_image.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class MesmerizingSliverAppBar extends ConsumerStatefulWidget {
  const MesmerizingSliverAppBar({super.key, required this.title});

  final String title;
  @override
  ConsumerState<MesmerizingSliverAppBar> createState() => _MesmerizingSliverAppBarState();
}

class _MesmerizingSliverAppBarState extends ConsumerState<MesmerizingSliverAppBar> {
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

    return isMultiSelectEnabled
        ? SliverToBoxAdapter(
            child: switch (_scrollProgress) {
              < 0.8 => const SizedBox(height: 120),
              _ => const SizedBox(height: 352),
            },
          )
        : SliverAppBar(
            expandedHeight: 300.0,
            floating: false,
            pinned: true,
            snap: false,
            elevation: 0,
            leading: IconButton(
              icon: Icon(
                Platform.isIOS ? Icons.arrow_back_ios_new_rounded : Icons.arrow_back,
                color: Color.lerp(Colors.white, context.primaryColor, _scrollProgress),
                shadows: [
                  _scrollProgress < 0.95
                      ? Shadow(offset: const Offset(0, 2), blurRadius: 5, color: Colors.black.withValues(alpha: 0.5))
                      : const Shadow(offset: Offset(0, 2), blurRadius: 0, color: Colors.transparent),
                ],
              ),
              onPressed: () {
                context.pop();
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
                  centerTitle: true,
                  title: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: scrollProgress > 0.95
                        ? Text(
                            widget.title,
                            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.w600, fontSize: 18),
                          )
                        : null,
                  ),
                  background: _ExpandedBackground(scrollProgress: scrollProgress, title: widget.title),
                );
              },
            ),
          );
  }
}

class _ExpandedBackground extends ConsumerStatefulWidget {
  final double scrollProgress;
  final String title;

  const _ExpandedBackground({required this.scrollProgress, required this.title});

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
        unawaited(_slideController.forward());
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

    return Stack(
      fit: StackFit.expand,
      children: [
        Transform.translate(
          offset: Offset(0, widget.scrollProgress * 50),
          child: Transform.scale(
            scale: 1.4 - (widget.scrollProgress * 0.2),
            child: RandomAssetBackgroundImage(timelineService: timelineService),
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
                Colors.black.withValues(alpha: 0.6 + (widget.scrollProgress * 0.2)),
              ],
              stops: const [0.0, 0.65, 1.0],
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
                SizedBox(
                  width: double.infinity,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Text(
                      widget.title,
                      maxLines: 1,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                        shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black45)],
                      ),
                    ),
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  child: const ItemCountText(
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      shadows: [Shadow(offset: Offset(0, 1), blurRadius: 6, color: Colors.black45)],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
