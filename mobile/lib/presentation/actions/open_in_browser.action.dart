import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:url_launcher/url_launcher.dart';

class OpenInBrowserAction extends BaseAction {
  final String remoteId;
  final TimelineOrigin origin;

  OpenInBrowserAction({required this.remoteId, required this.origin, required super.scope})
    : super(icon: Icons.open_in_browser, label: scope.context.t.open_in_browser);

  @override
  Future<void> onAction() async {
    final serverEndpoint = Store.get(.serverEndpoint).replaceFirst('/api', '');

    final originPath = switch (origin) {
      .favorite => '/favorites',
      .trash => '/trash',
      .archive => '/archive',
      _ => '',
    };

    final url = Uri.parse('$serverEndpoint$originPath/photos/$remoteId');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: .externalApplication);
    }
  }
}
