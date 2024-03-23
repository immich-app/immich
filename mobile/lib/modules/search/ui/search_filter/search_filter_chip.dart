import 'package:flutter/material.dart';

class SearchFilterChip extends StatelessWidget {
  final String label;
  final Function() onTap;
  const SearchFilterChip({super.key, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 0,
        shape:
            StadiumBorder(side: BorderSide(color: Colors.grey.withAlpha(100))),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
          child: Row(
            children: [
              Text(label),
              const Icon(
                Icons.arrow_drop_down,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
