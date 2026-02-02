import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';

class SslClientCertSettings extends StatefulWidget {
  const SslClientCertSettings({super.key, required this.isLoggedIn});

  final bool isLoggedIn;

  @override
  State<StatefulWidget> createState() => _SslClientCertSettingsState();
}

class _SslClientCertSettingsState extends State<SslClientCertSettings> {
  _SslClientCertSettingsState() : isCertExist = SSLClientCertStoreVal.load() != null;

  bool isCertExist;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      horizontalTitleGap: 20,
      isThreeLine: true,
      title: Text("client_cert_title".tr(), style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "client_cert_subtitle".tr(),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ElevatedButton(onPressed: widget.isLoggedIn ? null : importCert, child: Text("client_cert_import".tr())),
              ElevatedButton(onPressed: widget.isLoggedIn ? null : removeCert, child: Text("remove".tr())),
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
        actions: [TextButton(onPressed: () => ctx.pop(), child: Text("client_cert_dialog_msg_confirm".tr()))],
      ),
    );
  }

  Future<void> importCert() async {
    try {
      final cert = await networkApi.selectCertificate();
      await SSLClientCertStoreVal(cert.data, cert.password).save();
      await HttpSSLOptions.apply();
      showMessage(context, "client_cert_import_success_msg".tr());
    } catch (e) {
      showMessage(context, "client_cert_invalid_msg".tr());
    }
  }

  Future<void> removeCert() async {
    try {
      await networkApi.removeCertificate();
      await SSLClientCertStoreVal.delete();
      await HttpSSLOptions.apply();
      showMessage(context, "client_cert_remove_msg".tr());
    } catch (e) {
      showMessage(context, "client_cert_invalid_msg".tr());
    }
  }
}
