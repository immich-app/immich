import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:url_launcher/url_launcher.dart';

class OpenInBrowserAction extends ActionBuilder {
  final String remoteId;
  final TimelineOrigin origin;

  const OpenInBrowserAction({required this.remoteId, required this.origin});

  @override
  ActionItem create(BuildContext context, WidgetRef ref) =>
      .new(icon: Icons.open_in_browser, label: context.t.open_in_browser, onAction: () => _open(ref));

  Future<void> _open(WidgetRef ref) async {
    final serverEndpoint = ref.read(storeServiceProvider).get(.serverEndpoint).replaceFirst('/api', '');
    final url = Uri.parse('$serverEndpoint${webPathFor(origin)}/photos/$remoteId');

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: .externalApplication);
    }
  }
}

@visibleForTesting
String webPathFor(TimelineOrigin origin) => switch (origin) {
  .favorite => '/favorites',
  .trash => '/trash',
  .archive => '/archive',
  _ => '',
};
