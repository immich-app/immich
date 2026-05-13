import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:immich_ui/src/internal.dart';

class ImmichForm extends StatefulWidget {
  final String? submitText;
  final IconData? submitIcon;
  final FutureOr<void> Function()? onSubmit;
  final Widget child;

  const ImmichForm({
    super.key,
    this.submitText,
    this.submitIcon,
    required this.onSubmit,
    required this.child,
  });

  @override
  State<ImmichForm> createState() => ImmichFormState();

  static ImmichFormState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_ImmichFormScope>();
    if (scope == null) {
      throw FlutterError(
        'ImmichForm.of() called with a context that does not contain an ImmichForm.\n'
        'No ImmichForm ancestor could be found starting from the context that was passed to '
        'ImmichForm.of(). This usually happens when the context provided is '
        'from a widget above the ImmichForm.\n'
        'The context used was:\n'
        '$context',
      );
    }
    return scope._formState;
  }
}

class ImmichFormState extends State<ImmichForm> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  FutureOr<void> submit() async {
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await widget.onSubmit?.call();
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final submitText = widget.submitText ?? context.translations.submit;
    return _ImmichFormScope(
      formState: this,
      child: Form(
        key: _formKey,
        child: Column(
          spacing: ImmichSpacing.md,
          children: [
            widget.child,
            ImmichTextButton(
              labelText: submitText,
              icon: widget.submitIcon,
              variant: ImmichVariant.filled,
              loading: _isLoading,
              onPressed: submit,
              disabled: widget.onSubmit == null,
            ),
          ],
        ),
      ),
    );
  }
}

class _ImmichFormScope extends InheritedWidget {
  const _ImmichFormScope({required super.child, required ImmichFormState formState}) : _formState = formState;

  final ImmichFormState _formState;

  @override
  bool updateShouldNotify(_ImmichFormScope oldWidget) => oldWidget._formState != _formState;
}
