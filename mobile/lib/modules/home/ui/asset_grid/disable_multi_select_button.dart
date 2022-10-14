import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class DisableMultiSelectButton extends ConsumerWidget {
  const DisableMultiSelectButton({
    Key? key,
    required this.onPressed,
    required this.selectedItemCount,
  }) : super(key: key);

  final Function onPressed;
  final int selectedItemCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
        padding: const EdgeInsets.only(left: 16.0, top: 15),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: ElevatedButton.icon(
            onPressed: () {
              onPressed();
            },
            icon: const Icon(Icons.close_rounded),
            label: Text(
              '$selectedItemCount',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 18,
              ),
            ),
          ),
        ),
    );
  }
}
