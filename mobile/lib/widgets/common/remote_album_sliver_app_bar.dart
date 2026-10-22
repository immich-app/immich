import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/presentation/widgets/sliver_app_bar/item_count_text.widget.dart';
import 'package:immich_mobile/presentation/widgets/sliver_app_bar/random_asset_background_image.widget.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/remote_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/album/remote_album_shared_user_icons.dart';

class RemoteAlbumSliverAppBar extends ConsumerStatefulWidget {
  const RemoteAlbumSliverAppBar({super.key, required this.kebabMenu, this.onEditTitle, this.onActivity});

  final Widget kebabMenu;
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

    final Color? actionIconColor = Color.lerp(Colors.white, context.primaryColor, _scrollProgress);

    final List<Shadow> actionIconShadows = [
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
              onPressed: () => context.maybePop(),
            ),
      actions: [
        IconButton(
          onPressed: () => context.pushRoute(SlideshowRoute(timeline: ref.read(timelineServiceProvider))),
          icon: Icon(Icons.slideshow_outlined, color: actionIconColor, shadows: actionIconShadows),
        ),
        if (currentAlbum.isActivityEnabled && currentAlbum.isShared)
          IconButton(
            icon: Icon(Icons.chat_outlined, color: actionIconColor, shadows: actionIconShadows),
            onPressed: widget.onActivity,
          ),
        widget.kebabMenu,
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
            background: _ExpandedBackground(scrollProgress: scrollProgress, onEditTitle: widget.onEditTitle),
          );
        },
      ),
    );
  }
}

class _ExpandedBackground extends ConsumerStatefulWidget {
  final double scrollProgress;
  final void Function()? onEditTitle;

  const _ExpandedBackground({required this.scrollProgress, this.onEditTitle});

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
            child: RandomAssetBackgroundImage(timelineService: timelineService),
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
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      child: const ItemCountText(
                        style: TextStyle(
                          color: Colors.white,
                          shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black87)],
                        ),
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: widget.onEditTitle,
                  child: LayoutBuilder(
                    builder: (context, constraints) =>
                        _DynamicText(text: currentAlbum.name, maxWidth: constraints.maxWidth),
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

class _DynamicText extends StatelessWidget {
  final String text;
  final double maxWidth;

  const _DynamicText({required this.text, required this.maxWidth});

  static const _baseTextStyle = TextStyle(
    color: Colors.white,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black54)],
    overflow: TextOverflow.ellipsis,
  );

  int _lineCount(double fontSize) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: _baseTextStyle.copyWith(fontSize: fontSize),
      ),
      maxLines: 3,
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: maxWidth);
    return textPainter.computeLineMetrics().length;
  }

  double _fontSize() {
    final fontSizes = [44.0, 36.0];
    for (final fontSize in fontSizes) {
      final lineCount = _lineCount(fontSize);
      if (lineCount == 1) {
        return fontSize;
      }
    }
    return 28;
  }

  @override
  Widget build(BuildContext context) {
    return Text(text, style: _baseTextStyle.copyWith(fontSize: _fontSize()), maxLines: 3);
  }
}
