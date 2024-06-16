import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/search/search_row_title.dart';

class SearchRowSection extends StatelessWidget {
  const SearchRowSection({
    super.key,
    required this.onViewAllPressed,
    required this.title,
    this.isEmpty = false,
    required this.child,
  });

  final Function() onViewAllPressed;
  final String title;
  final bool isEmpty;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SearchRowTitle(
            onViewAllPressed: onViewAllPressed,
            title: title,
          ),
        ),
        child,
      ],
    );
  }
}
