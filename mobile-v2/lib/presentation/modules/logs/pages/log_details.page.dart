import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_appbar.widget.dart';
import 'package:immich_mobile/presentation/theme/app_typography.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:immich_mobile/utils/snackbar_manager.dart';
import 'package:material_symbols_icons/symbols.dart';

@RoutePage()
class LogDetailsPage extends StatelessWidget {
  final LogMessage log;

  const LogDetailsPage({super.key, required this.log});

  String _getClipboardText() {
    return """
Message: ${log.content}
Logged at: ${log.createdAt}
Context: ${log.logger ?? "<NA>"}
Error: ${log.error ?? "<NA>"}
Stack:
------
${log.stack ?? "<NA>"}
""";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ImAdaptiveRouteAppBar(
        title: context.t.logs.detail.title,
        isPrimary: false,
        actions: [
          IconButton(
            onPressed: () => unawaited(
              Clipboard.setData(ClipboardData(text: _getClipboardText()))
                  .then((_) {
                if (context.mounted) {
                  SnackbarManager.showText(
                    content: context.t.common.copied_long,
                  );
                }
              }),
            ),
            icon: Icon(
              Symbols.copy_all_rounded,
              color: context.colorScheme.primary,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          children: [
            _TextWithCopy(
              heading: context.t.logs.detail.message_heading,
              text: log.content,
            ),
            Divider(),
            if (log.logger != null) ...<Widget>[
              _TextWithCopy(
                heading: context.t.logs.detail.context_heading,
                text: log.logger!.toString(),
              ),
              Divider(),
            ],
            if (log.error != null) ...<Widget>[
              _TextWithCopy(
                heading: context.t.logs.detail.error_heading,
                text: log.error!.toString(),
              ),
              Divider(),
            ],
            if (log.stack != null) ...<Widget>[
              _TextWithCopy(
                heading: context.t.logs.detail.stack_heading,
                text: log.stack!.toString(),
              ),
              Divider(),
            ],
          ],
        ),
      ),
    );
  }
}

class _TextWithCopy extends StatelessWidget {
  final String heading;
  final String text;

  const _TextWithCopy({required this.heading, required this.text});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 10.0),
          child: Text(
            heading,
            style: AppTypography.bodyMedium.copyWith(
              color: context.colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 16.0, bottom: 10.0),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SelectableText(
              text,
              style: AppTypography.bodySmall,
              textAlign: TextAlign.justify,
            ),
          ),
        ),
      ],
    );
  }
}
