import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/user.provider.dart';

class ActionScope {
  final BuildContext context;
  final WidgetRef ref;
  final UserDto authUser;

  const ActionScope({required this.context, required this.ref, required this.authUser});

  factory ActionScope.from(BuildContext context, WidgetRef ref) {
    final authUser = ref.watch(currentUserProvider);
    if (authUser == null) {
      throw StateError('Auth user is not available in ActionScope');
    }

    return ActionScope(context: context, ref: ref, authUser: authUser);
  }
}

abstract class BaseAction {
  final ActionScope scope;
  final IconData icon;
  final String label;
  final bool isVisible;

  const BaseAction({required this.scope, required this.icon, required this.label, this.isVisible = true});

  Future<void> onAction();

  Future<void> Function()? get onSecondaryAction => null;
}
