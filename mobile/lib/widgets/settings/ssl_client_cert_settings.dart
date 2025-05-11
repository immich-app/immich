import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

class SslClientCertSettings extends StatefulWidget {
  const SslClientCertSettings({super.key, required this.isLoggedIn});

  final bool isLoggedIn;

  @override
  State<StatefulWidget> createState() => _SslClientCertSettingsState();
}

class _SslClientCertSettingsState extends State<SslClientCertSettings> {
  _SslClientCertSettingsState()
      : isCertExist = SSLClientCertStoreVal.load() != null;

  bool isCertExist;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      title: Text(
        "client_cert_title".tr(),
        style: context.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "client_cert_subtitle".tr(),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceSecondary,
            ),
          ),
          const SizedBox(
            height: 6,
          ),
          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: widget.isLoggedIn ? null : () => importCert(context),
                child: Text("client_cert_import".tr()),
              ),
              const SizedBox(
                width: 15,
              ),
              ElevatedButton(
                onPressed: widget.isLoggedIn || !isCertExist
                    ? null
                    : () => removeCert(context),
                child: Text("remove".tr()),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void showMessage(BuildContext context, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => ctx.pop(),
            child: Text("client_cert_dialog_msg_confirm".tr()),
          ),
        ],
      ),
    );
  }

  void storeCert(BuildContext context, Uint8List data, String? password) {
    if (password != null && password.isEmpty) {
      password = null;
    }
    final cert = SSLClientCertStoreVal(data, password);
    // Test whether the certificate is valid
    final isCertValid = HttpSSLCertOverride.setClientCert(
      SecurityContext(withTrustedRoots: true),
      cert,
    );
    if (!isCertValid) {
      showMessage(context, "client_cert_invalid_msg".tr());
      return;
    }
    cert.save();
    HttpOverrides.global = HttpSSLCertOverride();
    setState(
      () => isCertExist = true,
    );
    showMessage(context, "client_cert_import_success_msg".tr());
  }

  void setPassword(BuildContext context, Uint8List data) {
    final password = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        content: TextField(
          controller: password,
          obscureText: true,
          obscuringCharacter: "*",
          decoration: InputDecoration(
            hintText: "client_cert_enter_password".tr(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () =>
                {ctx.pop(), storeCert(context, data, password.text)},
            child: Text("client_cert_dialog_msg_confirm".tr()),
          ),
        ],
      ),
    );
  }

  Future<void> importCert(BuildContext ctx) async {
    FilePickerResult? res = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        'p12',
        'pfx',
      ],
    );
    if (res != null) {
      File file = File(res.files.single.path!);
      final bytes = await file.readAsBytes();
      setPassword(ctx, bytes);
    }
  }

  void removeCert(BuildContext context) {
    SSLClientCertStoreVal.delete();
    HttpOverrides.global = HttpSSLCertOverride();
    setState(
      () => isCertExist = false,
    );
    showMessage(context, "client_cert_remove_msg".tr());
  }
}
