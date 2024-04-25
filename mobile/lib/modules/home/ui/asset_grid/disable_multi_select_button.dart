import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class DisableMultiSelectButton extends ConsumerWidget {
  const DisableMultiSelectButton({
    super.key,
    required this.onPressed,
    required this.selectedItemCount,
  });

  final Function onPressed;
  final int selectedItemCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Align(
      alignment: Alignment.topLeft,
      child: Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 8.0),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: ElevatedButton.icon(
            onPressed: () => onPressed(),
            icon: const Icon(Icons.close_rounded),
            label: Text(
              '$selectedItemCount',
              style: context.textTheme.titleMedium?.copyWith(
                height: 2.5,
                color: context.isDarkTheme ? Colors.black : Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
