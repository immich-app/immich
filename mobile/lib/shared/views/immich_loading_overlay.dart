import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/providers/immich_loading_overlay.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';

class ImmichLoadingOverlay extends StatefulHookConsumerWidget {
  final ThemeData theme;
  final ThemeData darkTheme;

  const ImmichLoadingOverlay(
      {super.key, required this.theme, required this.darkTheme});

  @override
  ImmichLoadingOverlayState createState() => ImmichLoadingOverlayState();
}

class ImmichLoadingOverlayState extends ConsumerState<ImmichLoadingOverlay>
    with WidgetsBindingObserver {
  Brightness currentPlatformBrightness =
      WidgetsBinding.instance.platformDispatcher.platformBrightness;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangePlatformBrightness() {
    super.didChangePlatformBrightness();

    setState(() {
      currentPlatformBrightness =
          WidgetsBinding.instance.platformDispatcher.platformBrightness;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shouldShow = ref.watch(immichLoadingOverlayController);

    final themeMode = ref.watch(immichThemeProvider);
    final currentBrightness = themeMode == ThemeMode.system
        ? currentPlatformBrightness
        : themeMode == ThemeMode.dark
            ? Brightness.dark
            : Brightness.light;

    return IgnorePointer(
      child: shouldShow
          ? Theme(
              data: currentBrightness == Brightness.dark
                  ? widget.darkTheme
                  : widget.theme,
              child: Container(
                width: double.infinity,
                height: double.infinity,
                color: context.colorScheme.surface.withAlpha(70),
                child: const Center(child: ImmichLoadingIndicator()),
              ),
            )
          : const SizedBox(),
    );
  }
}
