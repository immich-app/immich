import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class CameraPicker extends HookConsumerWidget {
  const CameraPicker({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final make = [
      const DropdownMenuItem(value: "Nikon", child: Text("Nikon")),
      const DropdownMenuItem(value: "Canon", child: Text("Canon")),
      const DropdownMenuItem(value: "Sony", child: Text("Sony")),
      const DropdownMenuItem(value: "Fujifilm", child: Text("Fujifilm")),
      const DropdownMenuItem(value: "Panasonic", child: Text("Panasonic")),
      const DropdownMenuItem(value: "Olympus", child: Text("Olympus")),
    ];

    final models = [
      const DropdownMenuItem(value: "D3500", child: Text("D3500")),
      const DropdownMenuItem(value: "D5600", child: Text("D5600")),
      const DropdownMenuItem(value: "D7500", child: Text("D7500")),
      const DropdownMenuItem(value: "D780", child: Text("D780")),
      const DropdownMenuItem(value: "D850", child: Text("D850")),
      const DropdownMenuItem(value: "D6", child: Text("D6")),
    ];
    return Row(
      children: [
        DropdownButton(, items: make, onChanged: (value) {}),
        DropdownButton(items: models, onChanged: (value) {}),
      ],
    );
  }
}
