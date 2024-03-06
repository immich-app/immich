import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/modules/memories/providers/memory_auto_play.provider.dart';

class MemoryProgressIndicator extends StatelessWidget {
  /// The number of ticks in the progress indicator
  final int ticks;

  /// The current index of memory
  final int value;

  /// The duration to animate the current tick
  final int animationDuration;

  const MemoryProgressIndicator({
    super.key,
    required this.ticks,
    required this.value,
    required this.animationDuration,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tickWidth = constraints.maxWidth / ticks;
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(
            ticks,
            (i) => i > value
                ? _NonAnimatingTick(
                    width: tickWidth,
                    filled: false,
                  )
                : i < value
                    ? _NonAnimatingTick(
                        width: tickWidth,
                        filled: true,
                      )
                    : _AnimatingTick(
                        width: tickWidth,
                        duration: animationDuration,
                      ),
          ),
        );
      },
    );
  }
}

class _NonAnimatingTick extends StatelessWidget {
  final double width;
  final bool filled;

  const _NonAnimatingTick({required this.width, required this.filled});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: 4,
      decoration: BoxDecoration(
        color: filled ? immichDarkThemePrimaryColor : Colors.grey,
        borderRadius: const BorderRadius.all(Radius.circular(5)),
        border: const Border(
          left: BorderSide(color: Colors.black, width: 1),
          right: BorderSide(color: Colors.black, width: 1),
        ),
      ),
    );
  }
}

class _AnimatingTick extends HookConsumerWidget {
  final double width;
  final int duration;

  const _AnimatingTick({
    required this.width,
    required this.duration,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final animationController =
        useAnimationController(duration: Duration(seconds: duration));

    useEffect(
      () {
        if (ref.read(memoryAutoPlayProvider)) {
          WidgetsBinding.instance
              .addPostFrameCallback((_) => animationController.forward());
        }
        return null;
      },
      [],
    );

    ref.listen(memoryAutoPlayProvider, (_, value) {
      if (!value) {
        animationController.stop();
      } else {
        animationController.forward();
      }
    });

    return AnimatedBuilder(
      animation: animationController,
      builder: (_, __) {
        final filledWidth =
            Tween(begin: 0.0, end: width).evaluate(animationController);
        return Container(
          width: width,
          height: 4,
          decoration: const BoxDecoration(
            borderRadius: BorderRadius.all(Radius.circular(5)),
            border: Border(
              left: BorderSide(color: Colors.black, width: 1),
              right: BorderSide(color: Colors.black, width: 1),
            ),
          ),
          child: LinearProgressIndicator(
            value: filledWidth / width,
            backgroundColor: Colors.grey,
            color: immichDarkThemePrimaryColor,
            borderRadius: const BorderRadius.all(Radius.circular(5)),
          ),
        );
      },
    );
  }
}
