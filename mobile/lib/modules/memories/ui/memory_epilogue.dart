import 'package:flutter/material.dart';

class MemoryEpilogue extends StatelessWidget {
  const MemoryEpilogue({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            children: [
              Icon(
                Icons.check_circle_outline,
                color: Theme.of(context).primaryColor,
                size: 48.0,
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
            ],
          ),
        ),
        Column(
          children: [
            const Icon(
              Icons.arrow_upward,
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
