import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class BackupInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String info;

  final VoidCallback? onTap;
  final bool isLoading;
  const BackupInfoCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.info,
    this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(
          Radius.circular(20), // if you need this
        ),
        side: BorderSide(color: context.colorScheme.outlineVariant, width: 1),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: Column(
        children: [
          ListTile(
            minVerticalPadding: 18,
            isThreeLine: true,
            title: Text(title, style: context.textTheme.titleMedium),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0, right: 18.0),
              child: Text(
                subtitle,
                style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  children: [
                    Text(
                      info,
                      style: context.textTheme.titleLarge?.copyWith(
                        color: context.colorScheme.onSurface.withAlpha(isLoading ? 50 : 255),
                      ),
                    ),
                    if (isLoading)
                      Positioned.fill(
                        child: Align(
                          alignment: Alignment.center,
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: context.colorScheme.onSurface.withAlpha(150),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                Text(
                  "backup_info_card_assets",
                  style: context.textTheme.labelLarge?.copyWith(
                    color: context.colorScheme.onSurface.withAlpha(isLoading ? 50 : 255),
                  ),
                ).tr(),
              ],
            ),
          ),

          if (onTap != null) ...[
            const Divider(height: 0),
            ListTile(
              enableFeedback: true,
              visualDensity: VisualDensity.compact,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 0.0),
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
              ),
              onTap: onTap,
              title: Text(
                "view_details".t(context: context),
                style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
              ),
              trailing: Icon(Icons.arrow_forward_ios, size: 16, color: context.colorScheme.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }
}
