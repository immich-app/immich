import 'package:flutter/material.dart';

class PageTitle extends StatelessWidget {
  final String title;
  final Widget child;

  const PageTitle({super.key, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Title(
      title: '$title | @immich/ui',
      color: Theme.of(context).colorScheme.primary,
      child: child,
    );
  }
}
