import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/sliver_app_bar/item_count_text.widget.dart';
import 'package:immich_mobile/presentation/widgets/sliver_app_bar/random_asset_background_image.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/people.utils.dart';

class PersonSliverAppBar extends ConsumerStatefulWidget {
  const PersonSliverAppBar({
    super.key,
    required this.person,
    required this.onNameTap,
    required this.onShowOptions,
    required this.onBirthdayTap,
  });

  final Person person;
  final VoidCallback onNameTap;
  final VoidCallback onBirthdayTap;
  final VoidCallback onShowOptions;

  @override
  ConsumerState<PersonSliverAppBar> createState() => _MesmerizingSliverAppBarState();
}

class _MesmerizingSliverAppBarState extends ConsumerState<PersonSliverAppBar> {
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
    final Color? actionIconColor = Color.lerp(Colors.white, context.primaryColor, _scrollProgress);
    final List<Shadow> actionIconShadows = [
      if (_scrollProgress < 0.95)
        Shadow(offset: const Offset(0, 2), blurRadius: 5, color: Colors.black.withValues(alpha: 0.5))
      else
        const Shadow(offset: Offset(0, 2), blurRadius: 0, color: Colors.transparent),
    ];

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
            actions: [
              IconButton(
                icon: Icon(Icons.more_vert, color: actionIconColor, shadows: actionIconShadows),
                onPressed: widget.onShowOptions,
              ),
            ],
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
                            widget.person.name,
                            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.w600, fontSize: 18),
                          )
                        : null,
                  ),
                  background: _ExpandedBackground(
                    scrollProgress: scrollProgress,
                    person: widget.person,
                    onNameTap: widget.onNameTap,
                    onBirthdayTap: widget.onBirthdayTap,
                  ),
                );
              },
            ),
          );
  }
}

class _ExpandedBackground extends ConsumerStatefulWidget {
  final double scrollProgress;
  final Person person;
  final VoidCallback onNameTap;
  final VoidCallback onBirthdayTap;

  const _ExpandedBackground({
    required this.scrollProgress,
    required this.person,
    required this.onNameTap,
    required this.onBirthdayTap,
  });

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
            child: Row(
              children: [
                SizedBox(
                  height: 84,
                  width: 84,
                  child: Material(
                    shape: const CircleBorder(side: BorderSide(color: Colors.grey, width: 1.0)),
                    elevation: 3,
                    child: CircleAvatar(
                      maxRadius: 84 / 2,
                      backgroundImage: RemoteImageProvider(
                        url: getFaceThumbnailUrl(widget.person.id, updatedAt: widget.person.updatedAt),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      GestureDetector(
                        onTap: () => widget.onNameTap.call(),
                        child: SizedBox(
                          width: double.infinity,
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: widget.person.name.isNotEmpty
                                ? Text(
                                    widget.person.name,
                                    maxLines: 1,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 36,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                      shadows: [Shadow(offset: Offset(0, 2), blurRadius: 12, color: Colors.black45)],
                                    ),
                                  )
                                : Text(
                                    context.t.add_a_name,
                                    style: context.textTheme.titleLarge?.copyWith(
                                      color: Colors.grey[400],
                                      fontSize: 36,
                                      decoration: TextDecoration.underline,
                                      decorationColor: Colors.white,
                                    ),
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
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: widget.onBirthdayTap,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.cake_rounded, color: Colors.white, size: 14),
                            const SizedBox(width: 4),

                            if (widget.person.birthDate != null)
                              Text(
                                "${DateFormat.yMMMd(context.locale.toString()).format(widget.person.birthDate!)} (${formatAge(widget.person.birthDate!, DateTime.now())})",
                                style: context.textTheme.labelLarge?.copyWith(
                                  color: Colors.white,
                                  height: 1.2,
                                  fontSize: 14,
                                ),
                              )
                            else
                              Text(
                                context.t.add_birthday,
                                style: context.textTheme.labelLarge?.copyWith(
                                  color: Colors.grey[400],
                                  height: 1.2,
                                  fontSize: 14,
                                  decoration: TextDecoration.underline,
                                  decorationColor: Colors.white,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
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
