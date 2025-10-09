import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class MemoryProgressIndicator extends StatelessWidget {
  /// The number of ticks in the progress indicator
  final int ticks;

  /// The current value of the indicator
  final double value;

  const MemoryProgressIndicator({super.key, required this.ticks, required this.value});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final tickWidth = constraints.maxWidth / ticks;
        return ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(2.0)),
          child: Stack(
            children: [
              LinearProgressIndicator(
                value: value,
                borderRadius: const BorderRadius.all(Radius.circular(10.0)),
                backgroundColor: Colors.grey[800],
                color: context.isDarkTheme ? context.colorScheme.primary : context.colorScheme.inversePrimary,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(
                  ticks,
                  (i) => Container(
                    width: tickWidth,
                    height: 4,
                    decoration: BoxDecoration(
                      border: i == 0 ? null : const Border(left: BorderSide(color: Colors.black, width: 1)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
