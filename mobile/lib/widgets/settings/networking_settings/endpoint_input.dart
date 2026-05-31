import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';
import 'package:immich_ui/immich_ui.dart';

class EndpointInput extends StatefulHookConsumerWidget {
  const EndpointInput({
    super.key,
    required this.initialValue,
    required this.index,
    required this.onValidated,
    required this.onDismissed,
    this.enabled = true,
  });

  final AuxilaryEndpoint initialValue;
  final int index;
  final Function(String url, int index, AuxCheckStatus status) onValidated;
  final Function(int index) onDismissed;
  final bool enabled;

  @override
  EndpointInputState createState() => EndpointInputState();
}

class EndpointInputState extends ConsumerState<EndpointInput> {
  late final TextEditingController controller;
  late final FocusNode focusNode;
  late AuxCheckStatus auxCheckStatus;
  bool isInputValid = false;

  @override
  void initState() {
    super.initState();
    controller = TextEditingController(text: widget.initialValue.url);
    focusNode = FocusNode()..addListener(_onOutFocus);

    setState(() {
      auxCheckStatus = widget.initialValue.status;
    });
  }

  @override
  void dispose() {
    focusNode.removeListener(_onOutFocus);
    focusNode.dispose();
    controller.dispose();
    super.dispose();
  }

  void _onOutFocus() {
    if (!focusNode.hasFocus && isInputValid) {
      validateAuxilaryServerUrl();
    }
  }

  Future<void> validateAuxilaryServerUrl() async {
    final url = controller.text;
    setState(() => auxCheckStatus = AuxCheckStatus.loading);

    final isValid = await ref.read(authProvider.notifier).validateAuxilaryServerUrl(url);

    setState(() {
      if (mounted) {
        auxCheckStatus = isValid ? AuxCheckStatus.valid : AuxCheckStatus.error;
      }
    });

    widget.onValidated(url, widget.index, auxCheckStatus);
  }

  String? validateUrl(String? url) {
    try {
      if (url == null || url.isEmpty || !Uri.parse(url).isAbsolute) {
        isInputValid = false;
        return 'validate_endpoint_error'.tr();
      }
    } catch (_) {
      isInputValid = false;
      return 'validate_endpoint_error'.tr();
    }

    isInputValid = true;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(widget.index.toString()),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => widget.onDismissed(widget.index),
      background: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 24),
        trailing: ReorderableDragStartListener(
          enabled: widget.enabled,
          index: widget.index,
          child: const Icon(Icons.drag_handle_rounded),
        ),
        leading: NetworkStatusIcon(
          key: ValueKey('status_$auxCheckStatus'),
          status: auxCheckStatus,
          enabled: widget.enabled,
        ),
        subtitle: ImmichURLInput(
          enabled: widget.enabled,
          autovalidateMode: .onUserInteraction,
          validator: validateUrl,
          keyboardAction: .next,
          hintText: 'http(s)://immich.domain.com',
          controller: controller,
          focusNode: focusNode,
        ),
      ),
    );
  }
}
