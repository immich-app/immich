import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/common/http.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:ok_http/ok_http.dart';

class SslClientCertSettings extends StatefulWidget {
  const SslClientCertSettings({super.key, required this.isLoggedIn});

  final bool isLoggedIn;

  @override
  State<StatefulWidget> createState() => _SslClientCertSettingsState();
}

class _SslClientCertSettingsState extends State<SslClientCertSettings> {
  _SslClientCertSettingsState() : pKeyAlias = SSLClientCertStoreVal.load()?.privateKeyAlias ?? "";

  String pKeyAlias = "";

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
          if (pKeyAlias != "")
            Center(
              child: Container(
                margin: const EdgeInsets.fromLTRB(0, 6, 0, 6),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: context.colorScheme.primaryContainer.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.colorScheme.primary.withValues(alpha: 0.3), width: 1),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock_outline, size: 16, color: context.colorScheme.primary),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        pKeyAlias,
                        style: context.textTheme.bodySmall?.copyWith(
                          color: context.colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (pKeyAlias == "")
            Center(
              child: Container(
                margin: const EdgeInsets.fromLTRB(0, 6, 0, 6),
                child: Text("no_certificate_selected".tr(), style: const TextStyle(fontStyle: FontStyle.italic)),
              ),
            ),
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: 6,
              children: [
                ElevatedButton(
                  onPressed: widget.isLoggedIn ? null : () async => await selectCert(context),
                  child: Text("select".tr()),
                ),
                ElevatedButton(
                  onPressed: widget.isLoggedIn || pKeyAlias == "" ? null : () async => await removeCert(context),
                  child: Text("remove".tr()),
                ),
              ],
            ),
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

  Future<void> selectCert(BuildContext context) async {
    String? chosenAlias = await choosePrivateKeyAlias();
    if (chosenAlias == null) {
      return;
    }
    setState(() => pKeyAlias = chosenAlias);
    await SSLClientCertStoreVal(chosenAlias).save();
    await refreshClient();
  }

  Future<void> removeCert(BuildContext context) async {
    setState(() => pKeyAlias = "");
    await const SSLClientCertStoreVal("").save();
    await refreshClient();
  }
}
