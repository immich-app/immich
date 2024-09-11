import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/url_helper.dart';

class ServerEndpointInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final Function()? onSubmit;

  const ServerEndpointInput({
    super.key,
    required this.controller,
    required this.focusNode,
    this.onSubmit,
  });

  String? _validateInput(String? url) {
    if (url == null || url.isEmpty) return null;

    final parsedUrl = Uri.tryParse(sanitizeUrl(url));
    if (parsedUrl == null ||
        !parsedUrl.isAbsolute ||
        !parsedUrl.scheme.startsWith("http") ||
        parsedUrl.host.isEmpty) {
      return 'login_form_err_invalid_url'.tr();
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: 'login_form_endpoint_url'.tr(),
          border: const OutlineInputBorder(),
          hintText: 'login_form_endpoint_hint'.tr(),
          errorMaxLines: 4,
        ),
        validator: _validateInput,
        autovalidateMode: AutovalidateMode.always,
        focusNode: focusNode,
        autofillHints: const [AutofillHints.url],
        keyboardType: TextInputType.url,
        autocorrect: false,
        onFieldSubmitted: (_) => onSubmit?.call(),
        textInputAction: TextInputAction.go,
      ),
    );
  }
}
