import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:url_launcher/url_launcher.dart';

class OpenInBrowserAction extends BaseAction {
  final TimelineOrigin origin;

  const OpenInBrowserAction({required this.origin});

  @override
  IconData get icon => Icons.open_in_browser;

  @override
  String label(context) => context.t.open_in_browser;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assets.firstOrNull?.hasRemote ?? false;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final serverEndpoint = Store.get(.serverEndpoint).replaceFirst('/api', '');
    final originPath = switch (origin) {
      .favorite => '/favorites',
      .trash => '/trash',
      .archive => '/archive',
      _ => '',
    };

    final remoteId = assets.first.remoteId;
    final url = Uri.parse('$serverEndpoint$originPath/photos/$remoteId');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: .externalApplication);
    }
  }
}
