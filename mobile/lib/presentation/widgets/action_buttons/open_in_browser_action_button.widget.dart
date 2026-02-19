import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:url_launcher/url_launcher.dart';

class OpenInBrowserActionButton extends ConsumerWidget {
  final String remoteId;
  final bool iconOnly;
  final bool menuItem;
  final Color? iconColor;

  const OpenInBrowserActionButton({
    super.key,
    required this.remoteId,
    this.iconOnly = false,
    this.menuItem = false,
    this.iconColor,
  });

  void _onTap() async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint).replaceFirst('/api', '');
    final url = '$serverEndpoint/photos/$remoteId';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      label: 'open_in_browser'.t(context: context),
      iconData: Icons.open_in_browser,
      iconColor: iconColor,
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: _onTap,
    );
  }
}
