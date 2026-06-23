import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

abstract class BaseAction {
  final IconData icon;

  const BaseAction({required this.icon});

  String label(BuildContext context);

  bool isVisible(BuildContext context, WidgetRef ref);

  Future<void> onAction(BuildContext context, WidgetRef ref);
}
