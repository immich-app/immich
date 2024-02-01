import 'package:flutter/material.dart';

class MemoryProgressIndicator extends StatelessWidget {
  /// The number of ticks in the progress indicator
  final int ticks;

  /// The current value of the indicator
  final double value;

  const MemoryProgressIndicator(
      {super.key, required this.ticks, required this.value});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tickWidth = constraints.maxWidth / ticks;
        return Stack(
          children: [
            LinearProgressIndicator(
              value: value,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(
                ticks,
                (i) => Container(
                  width: tickWidth,
                  height: 4,
                  decoration: BoxDecoration(
                    border: i == 0
                        ? null
                        : Border(
                            left: BorderSide(
                              color: Theme.of(context).scaffoldBackgroundColor,
                              width: 1,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
