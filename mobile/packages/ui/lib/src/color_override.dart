import 'package:flutter/widgets.dart';

class ImmichColorOverride extends InheritedWidget {
  const ImmichColorOverride({super.key, required this.color, required super.child});

  final Color? color;

  static Color? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ImmichColorOverride>()?.color;

  @override
  bool updateShouldNotify(ImmichColorOverride oldWidget) => color != oldWidget.color;
}
