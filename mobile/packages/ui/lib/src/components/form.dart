import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:immich_ui/src/internal.dart';

class ImmichFormController extends ChangeNotifier {
  ImmichFormController({this.onSubmit});

  FutureOr<void> Function()? onSubmit;
  final formKey = GlobalKey<FormState>();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> submit() async {
    if (_isLoading) {
      return;
    }
    if (!(formKey.currentState?.validate() ?? false)) {
      return;
    }

    _isLoading = true;
    notifyListeners();
    try {
      await onSubmit?.call();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

class ImmichForm extends StatefulWidget {
  final FutureOr<void> Function()? onSubmit;
  final Widget Function(BuildContext context, ImmichFormController form) builder;
  final String? submitText;
  final IconData? submitIcon;

  const ImmichForm({
    super.key,
    this.onSubmit,
    this.submitText,
    this.submitIcon,
    required this.builder,
  });

  @override
  State<ImmichForm> createState() => _ImmichFormState();
}

class _ImmichFormState extends State<ImmichForm> {
  late final ImmichFormController _controller;

  @override
  void initState() {
    super.initState();
    _controller = ImmichFormController(onSubmit: widget.onSubmit);
  }

  @override
  void didUpdateWidget(ImmichForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    _controller.onSubmit = widget.onSubmit;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final submitText = widget.submitText ?? context.translations.submit;
    return Form(
      key: _controller.formKey,
      child: Column(
        spacing: ImmichSpacing.md,
        children: [
          widget.builder(context, _controller),
          ListenableBuilder(
            listenable: _controller,
            builder: (context, _) => ImmichTextButton(
              labelText: submitText,
              icon: widget.submitIcon,
              variant: ImmichVariant.filled,
              loading: _controller.isLoading,
              onPressed: _controller.submit,
              disabled: _controller.onSubmit == null,
            ),
          ),
        ],
      ),
    );
  }
}
