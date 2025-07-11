import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';

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
      contentPadding: EdgeInsets.zero,
      horizontalTitleGap: 20,
      isThreeLine: true,
      title: Text(
        "client_cert_title".t(context: context),
        style: context.itemTitle,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "client_cert_subtitle".t(context: context),
            style: context.itemSubtitle,
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
                child: Text("client_cert_import".t(context: context)),
              ),
              const SizedBox(
                width: 15,
              ),
              ElevatedButton(
                onPressed: widget.isLoggedIn || !isCertExist
                    ? null
                    : () => removeCert(context),
                child: Text("remove".t(context: context)),
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
            child: Text("client_cert_dialog_msg_confirm".t(context: context)),
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
      showMessage(context, "client_cert_invalid_msg".t(context: context));
      return;
    }
    cert.save();
    HttpSSLOptions.apply();
    setState(
      () => isCertExist = true,
    );
    showMessage(context, "client_cert_import_success_msg".t(context: context));
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
            hintText: "client_cert_enter_password".t(context: context),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () =>
                {ctx.pop(), storeCert(context, data, password.text)},
            child: Text("client_cert_dialog_msg_confirm".t(context: context)),
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
    HttpSSLOptions.apply();
    setState(
      () => isCertExist = false,
    );
    showMessage(context, "client_cert_remove_msg".t(context: context));
  }
}
