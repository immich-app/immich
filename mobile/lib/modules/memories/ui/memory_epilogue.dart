import 'package:flutter/material.dart';

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
      seconds: 3,
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
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle_outline_sharp,
                color: Theme.of(context).primaryColor,
                size: 64.0,
              ),
              const SizedBox(height: 16.0),
              Text(
                'All caught up',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 16.0),
              Text(
                'Check back tomorrow for more memories',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16.0),
              TextButton(
                onPressed: widget.onStartOver,
                child: const Text('Start Over'),
              ),
            ],
          ),
        ),
        Column(
          children: [
            SizedBox(
              height: 48,
              child: AnimatedBuilder(
                animation: _animation,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, 5 * _animationController.value),
                    child: child,
                  );
                },
                child: const Icon(
                  size: 32,
                  Icons.expand_less_sharp,
                ),
              ),
            ),
            Text(
              'Swipe up to close',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ],
    );
  }
}
