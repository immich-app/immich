import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

class SslClientCertSettings extends HookConsumerWidget {
  const SslClientCertSettings({super.key});

  void storeCert(BuildContext context, Uint8List data, String? passwd) {
    if (passwd!.isEmpty) {
      passwd = null;
    }
    final cert = SSLClientCertStoreVal(data, passwd);
    cert.save();
    HttpOverrides.global = HttpSSLCertOverride();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        content: const Text("Imported Successfully"),
        actions: [
          TextButton(
            onPressed: () => ctx.pop(),
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void setPassword(BuildContext context, Uint8List data) {
    final passwd = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        content: TextField(
          controller: passwd,
          obscureText: true,
          obscuringCharacter: "*",
          decoration: const InputDecoration(
            hintText: "Enter password",
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => {ctx.pop(), storeCert(context, data, passwd.text)},
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  bool certExist() {
    return SSLClientCertStoreVal.load() != null;
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
    if (!certExist()) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          content: const Text("No client certificate exist!"),
          actions: [
            TextButton(
              onPressed: () => ctx.pop(),
              child: const Text("OK"),
            ),
          ],
        ),
      );
      return;
    }
    SSLClientCertStoreVal.delete();
    HttpOverrides.global = HttpSSLCertOverride();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        content: const Text("Client certificate is removed!"),
        actions: [
          TextButton(
            onPressed: () => ctx.pop(),
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    bool isLoggedIn = ref.read(currentUserProvider) != null;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      title: Text(
        "TLS Client Certificate",
        style: context.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Supports PKCS12 (.p12, .pfx) format only. "
            "Cert Import/Remove is available only before login",
            style: context.textTheme.bodyMedium,
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: isLoggedIn ? null : () => importCert(context),
                child: const Text("Import"),
              ),
              const SizedBox(
                width: 15,
              ),
              ElevatedButton(
                onPressed: isLoggedIn ? null : () => removeCert(context),
                child: const Text("Remove"),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
