import 'package:flutter/material.dart';

class DisableMultiSelectButton extends StatelessWidget {
  const DisableMultiSelectButton({
    Key? key,
    required this.onPressed,
    required this.selectedItemCount,
  }) : super(key: key);

  final Function onPressed;
  final int selectedItemCount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0, top: 16.0),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4.0),
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            foregroundColor: Theme.of(context).colorScheme.surface,
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
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
