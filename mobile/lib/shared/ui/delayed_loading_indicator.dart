import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class DelayedLoadingIndicator extends StatelessWidget {
  /// The delay to avoid showing the loading indicator
  final Duration delay;

  /// Defaults to using the [ImmichLoadingIndicator]
  final Widget? child;

  /// An optional fade in duration to animate the loading
  final Duration? fadeInDuration;

  const DelayedLoadingIndicator({
    super.key,
    this.delay = const Duration(seconds: 3),
    this.child,
    this.fadeInDuration,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: fadeInDuration ?? Duration.zero,
      child: FutureBuilder(
        future: Future.delayed(delay),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            return child ??
                const ImmichLoadingIndicator(
                  key: ValueKey('loading'),
                );
          }

          return Container(key: const ValueKey('hiding'));
        },
      ),
    );
  }
}
