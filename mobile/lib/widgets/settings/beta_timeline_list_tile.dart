import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class BetaTimelineListTile extends ConsumerStatefulWidget {
  const BetaTimelineListTile({super.key});

  @override
  ConsumerState<BetaTimelineListTile> createState() => _BetaTimelineListTileState();
}

class _BetaTimelineListTileState extends ConsumerState<BetaTimelineListTile> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _rotationAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<double> _gradientAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(duration: const Duration(seconds: 3), vsync: this);

    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.linear));

    _pulseAnimation = Tween<double>(
      begin: 1,
      end: 1.1,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeInOut));

    _gradientAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeInOut));

    _animationController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final betaTimelineValue = ref.watch(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.betaTimeline);
    final serverInfo = ref.watch(serverInfoProvider);
    final auth = ref.watch(authProvider);

    if (!auth.isAuthenticated || (serverInfo.serverVersion.minor < 136 && kReleaseMode)) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        void onSwitchChanged(bool value) {
          showDialog(
            context: context,
            builder: (context) {
              return AlertDialog(
                title: value ? const Text("Enable Beta Timeline") : const Text("Disable Beta Timeline"),
                content: value
                    ? const Text("Are you sure you want to enable the beta timeline?")
                    : const Text("Are you sure you want to disable the beta timeline?"),
                actions: [
                  TextButton(
                    onPressed: () {
                      context.pop();
                    },
                    child: Text(
                      "cancel".t(context: context),
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: context.colorScheme.outline),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      Navigator.of(context).pop();
                      context.router.replaceAll([ChangeExperienceRoute(switchingToBeta: value)]);
                    },
                    child: Text("ok".t(context: context)),
                  ),
                ],
              );
            },
          );
        }

        final gradientColors = [
          Color.lerp(
            context.primaryColor.withValues(alpha: 0.5),
            context.primaryColor.withValues(alpha: 0.3),
            _gradientAnimation.value,
          )!,
          Color.lerp(
            context.logoPink.withValues(alpha: 0.2),
            context.logoPink.withValues(alpha: 0.4),
            _gradientAnimation.value,
          )!,
          Color.lerp(
            context.logoRed.withValues(alpha: 0.3),
            context.logoRed.withValues(alpha: 0.5),
            _gradientAnimation.value,
          )!,
        ];

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(Radius.circular(12)),
            gradient: LinearGradient(
              colors: gradientColors,
              stops: const [0.0, 0.5, 1.0],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              transform: GradientRotation(_rotationAnimation.value * 0.5),
            ),
            boxShadow: [
              BoxShadow(color: context.primaryColor.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 2)),
            ],
          ),
          child: Container(
            margin: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(10.5)),
              color: context.scaffoldBackgroundColor,
            ),
            child: Material(
              borderRadius: const BorderRadius.all(Radius.circular(10.5)),
              child: InkWell(
                borderRadius: const BorderRadius.all(Radius.circular(10.5)),
                onTap: () => onSwitchChanged(!betaTimelineValue),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    children: [
                      Transform.scale(
                        scale: _pulseAnimation.value,
                        child: Transform.rotate(
                          angle: _rotationAnimation.value * 0.02,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [
                                  context.primaryColor.withValues(alpha: 0.2),
                                  context.primaryColor.withValues(alpha: 0.1),
                                ],
                              ),
                            ),
                            child: Icon(Icons.auto_awesome, color: context.primaryColor, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(width: 28),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text(
                                  "advanced_settings_beta_timeline_title".t(context: context),
                                  style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    borderRadius: const BorderRadius.all(Radius.circular(8)),
                                    gradient: LinearGradient(
                                      colors: [
                                        context.primaryColor.withValues(alpha: 0.8),
                                        context.primaryColor.withValues(alpha: 0.6),
                                      ],
                                    ),
                                  ),
                                  child: Text(
                                    'NEW',
                                    style: context.textTheme.labelSmall?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                      height: 1.2,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "advanced_settings_beta_timeline_subtitle".t(context: context),
                              style: context.textTheme.labelLarge?.copyWith(
                                color: context.textTheme.labelLarge?.color?.withValues(alpha: 0.9),
                              ),
                              maxLines: 2,
                            ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: betaTimelineValue,
                        onChanged: onSwitchChanged,
                        activeColor: context.primaryColor,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
