import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/platform/network_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:logging/logging.dart';

class SslClientCertSettings extends StatefulWidget {
  const SslClientCertSettings({super.key});

  @override
  State<StatefulWidget> createState() => _SslClientCertSettingsState();
}

class _SslClientCertSettingsState extends State<SslClientCertSettings> {
  final _log = Logger("SslClientCertSettings");

  bool isCertExist = false;

  @override
  void initState() {
    super.initState();
    unawaited(_checkCertificate());
  }

  Future<void> _checkCertificate() async {
    try {
      final exists = await networkApi.hasCertificate();
      if (mounted && exists != isCertExist) {
        setState(() => isCertExist = exists);
      }
    } catch (e) {
      _log.warning("Failed to check certificate existence", e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      title: Text(
        context.t.client_cert_title,
        style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.t.client_cert_subtitle,
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ElevatedButton(onPressed: importCert, child: Text(context.t.client_cert_import)),
              ElevatedButton(onPressed: !isCertExist ? null : removeCert, child: Text(context.t.remove)),
            ],
          ),
        ],
      ),
    );
  }

  void showMessage(String message) {
    context.showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 3),
        content: Text(message, style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor)),
      ),
    );
  }

  Future<void> importCert() async {
    try {
      final styling = ClientCertPrompt(
        title: context.t.client_cert_password_title,
        message: context.t.client_cert_password_message,
        cancel: context.t.cancel,
        confirm: context.t.confirm,
      );
      await networkApi.selectCertificate(styling);
      setState(() => isCertExist = true);
      showMessage(StaticTranslations.instance.client_cert_import_success_msg);
    } catch (e) {
      if (_isCancellation(e)) {
        return;
      }
      _log.severe("Error importing client cert", e);
      showMessage(StaticTranslations.instance.client_cert_invalid_msg);
    }
  }

  Future<void> removeCert() async {
    try {
      await networkApi.removeCertificate();
      setState(() => isCertExist = false);
      showMessage(StaticTranslations.instance.client_cert_remove_msg);
    } catch (e) {
      if (_isCancellation(e)) {
        return;
      }
      _log.severe("Error removing client cert", e);
      showMessage(StaticTranslations.instance.client_cert_invalid_msg);
    }
  }

  bool _isCancellation(Object e) => e is PlatformException && e.code.toLowerCase().contains("cancel");
}
