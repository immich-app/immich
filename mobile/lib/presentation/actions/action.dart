import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

class ActionScope {
  final BuildContext context;
  final WidgetRef ref;
  final UserDto authUser;

  const ActionScope({required this.context, required this.ref, required this.authUser});
}

abstract class BaseAction {
  const BaseAction();

  IconData get icon;

  String label(ActionScope scope);

  bool isVisible(ActionScope scope) => true;

  Future<void> onAction(ActionScope scope);
}
