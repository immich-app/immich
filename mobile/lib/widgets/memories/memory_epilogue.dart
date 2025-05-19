import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class MemoryEpilogue extends StatefulWidget {
  final Function()? onStartOver;

  const MemoryEpilogue({super.key, this.onStartOver});

  @override
  State<MemoryEpilogue> createState() => _MemoryEpilogueState();
}

class _MemoryEpilogueState extends State<MemoryEpilogue>
    with TickerProviderStateMixin {
  late final _animationController = AnimationController(
    vsync: this,
    duration: const Duration(
      seconds: 2,
    ),
  )..repeat(
      reverse: true,
    );

  late final Animation _animation;

  @override
  void initState() {
    super.initState();
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeIn,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Stack(
        children: [
          Positioned.fill(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.check_circle_outline_sharp,
                  color: context.isDarkTheme
                      ? context.colorScheme.primary
                      : context.colorScheme.inversePrimary,
                  size: 64.0,
                ),
                const SizedBox(height: 16.0),
                Text(
                  "memories_all_caught_up",
                  style: context.textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                  ),
                ).tr(),
                const SizedBox(height: 16.0),
                Text(
                  "memories_check_back_tomorrow",
                  style: context.textTheme.bodyMedium?.copyWith(
                    color: Colors.white,
                  ),
                ).tr(),
                const SizedBox(height: 16.0),
                TextButton(
                  onPressed: widget.onStartOver,
                  child: Text(
                    "memories_start_over",
                    style: context.textTheme.displayMedium?.copyWith(
                      color: context.isDarkTheme
                          ? context.colorScheme.primary
                          : context.colorScheme.inversePrimary,
                    ),
                  ).tr(),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Column(
                children: [
                  SizedBox(
                    height: 48,
                    child: AnimatedBuilder(
                      animation: _animation,
                      builder: (context, child) {
                        return Transform.translate(
                          offset: Offset(0, 8 * _animationController.value),
                          child: child,
                        );
                      },
                      child: const Icon(
                        size: 32,
                        Icons.expand_less_sharp,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  Text(
                    "memories_swipe_to_close",
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: Colors.white,
                    ),
                  ).tr(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
