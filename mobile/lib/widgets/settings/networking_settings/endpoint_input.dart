import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';

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

    final isValid =
        await ref.read(authProvider.notifier).validateAuxilaryServerUrl(url);

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
        child: const Icon(
          Icons.delete,
          color: Colors.white,
        ),
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
        subtitle: TextFormField(
          enabled: widget.enabled,
          onTapOutside: (_) => focusNode.unfocus(),
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: validateUrl,
          keyboardType: TextInputType.url,
          style: const TextStyle(
            fontFamily: 'Inconsolata',
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
          decoration: InputDecoration(
            hintText: 'http(s)://immich.domain.com',
            contentPadding: const EdgeInsets.all(16),
            filled: true,
            fillColor: context.colorScheme.surfaceContainer,
            border: const OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(16)),
            ),
            errorBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.red[300]!),
              borderRadius: const BorderRadius.all(Radius.circular(16)),
            ),
            disabledBorder: OutlineInputBorder(
              borderSide: BorderSide(
                color:
                    context.isDarkTheme ? Colors.grey[900]! : Colors.grey[300]!,
              ),
              borderRadius: const BorderRadius.all(Radius.circular(16)),
            ),
          ),
          controller: controller,
          focusNode: focusNode,
        ),
      ),
    );
  }
}
