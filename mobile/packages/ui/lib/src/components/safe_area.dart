import 'package:flutter/material.dart';

/// A [SafeArea] that only applies padding to the horizontal sides of the view
class ImmichHorizontalSafeArea extends StatelessWidget {
  final Widget child;

  const ImmichHorizontalSafeArea({super.key, required this.child});

  @override
  Widget build(BuildContext context) => SafeArea(top: false, bottom: false, child: child);
}

/// The sliver equivalent of [ImmichHorizontalSafeArea]
class ImmichSliverHorizontalSafeArea extends StatelessWidget {
  final Widget sliver;

  const ImmichSliverHorizontalSafeArea({super.key, required this.sliver});

  @override
  Widget build(BuildContext context) => SliverSafeArea(top: false, bottom: false, sliver: sliver);
}
