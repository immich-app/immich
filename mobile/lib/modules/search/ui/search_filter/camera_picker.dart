import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class CameraPicker extends HookConsumerWidget {
  const CameraPicker({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final make = [
      const DropdownMenuItem(value: "1", child: Text("1")),
      const DropdownMenuItem(value: "b", child: Text("b")),
    ];
    return Row(
      children: [
        DropdownButton(items: make, onChanged: (value) {}),
      ],
    );
  }
}
