import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/gap.widget.dart';
import 'package:immich_mobile/presentation/components/common/skeletonized_future_builder.widget.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_appbar.widget.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_wrapper.widget.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/theme/app_typography.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
import 'package:immich_mobile/utils/extensions/color.extension.dart';
import 'package:immich_mobile/utils/log_manager.dart';
import 'package:intl/intl.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';
import 'package:skeletonizer/skeletonizer.dart';

@RoutePage()
class LogsWrapperPage extends StatelessWidget {
  const LogsWrapperPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ImAdaptiveRouteWrapper(
      primaryRoute: LogsRoute.name,
      primaryBody: (_) => const LogsPage(),
      bodyRatio: RatioConstants.oneThird,
    );
  }
}

@RoutePage()
class LogsPage extends StatefulWidget {
  const LogsPage({super.key});

  @override
  State createState() => _LogsPageState();
}

class _LogsPageState extends State<LogsPage> {
  void _onClearLogs() {
    // refetch logs on clear
    setState(() {
      unawaited(LogManager.I.clearLogs());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ImAdaptiveRouteAppBar(
        title: context.t.logs.title,
        isPrimary: true,
        actions: [
          IconButton(
            onPressed: _onClearLogs,
            icon: Icon(Symbols.delete_rounded),
          ),
        ],
      ),
      body: SkeletonizedFutureBuilder(
        future: di<ILogRepository>().getAll(),
        builder: (_, data) => _LogList(logs: data!),
        loadingBuilder: (_) => const _LogListShimmer(),
        errorBuilder: (_, __) => const _LogListEmpty(),
        emptyBuilder: (_) => const _LogListEmpty(),
        emptyWhen: (data) => data == null || data.isEmpty,
      ),
    );
  }
}

class _LogLevelIndicator extends StatelessWidget {
  final LogLevel level;

  const _LogLevelIndicator({required this.level});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: switch (level) {
          LogLevel.info => context.colorScheme.primary,
          LogLevel.error ||
          LogLevel.wtf =>
            Colors.redAccent.harmonizeWith(context.colorScheme.primary),
          LogLevel.warning =>
            Colors.orangeAccent.harmonizeWith(context.colorScheme.primary),
          LogLevel.verbose ||
          LogLevel.debug =>
            Colors.grey.harmonizeWith(context.colorScheme.primary),
        },
        shape: BoxShape.circle,
      ),
      width: 10,
      height: 10,
    );
  }
}

class _LogList extends StatelessWidget {
  final List<LogMessage> logs;

  const _LogList({required this.logs});

  /// Truncate the log message to a [maxLines]] number of lines
  String _truncateLogMessage(String message) {
    final msg = message.split("\n").firstOrNull;
    return msg?.substring(0, 75.clamp(0, msg.length)) ?? message;
  }

  Color _getTileColor(BuildContext context, LogLevel level) {
    return switch (level) {
      LogLevel.info => Colors.transparent,
      LogLevel.error || LogLevel.wtf => Colors.redAccent
          .harmonizeWith(context.colorScheme.primary)
          .withOpacity(RatioConstants.halfQuarter),
      LogLevel.warning => Colors.orangeAccent
          .harmonizeWith(context.colorScheme.primary)
          .withOpacity(RatioConstants.halfQuarter),
      LogLevel.verbose || LogLevel.debug => context.colorScheme.primary
          .harmonizeWith(context.colorScheme.primary)
          .withOpacity(RatioConstants.halfQuarter),
    };
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemBuilder: (_, i) {
        final log = logs[i];
        return ListTile(
          leading: _LogLevelIndicator(level: log.level),
          title: Text(
            _truncateLogMessage(log.content),
            style: AppTypography.bodyMedium,
          ),
          subtitle: Text(
            "at ${DateFormat("HH:mm:ss.SSS").format(log.createdAt)} in ${log.logger ?? "<NA>"}",
            style: AppTypography.bodyMedium.copyWith(
              color: context.colorScheme.onSurface
                  .darken(amount: RatioConstants.oneThird),
            ),
          ),
          trailing: const Icon(Symbols.arrow_forward_ios_rounded, size: 18),
          dense: true,
          visualDensity: VisualDensity.compact,
          tileColor: _getTileColor(context, log.level),
          minLeadingWidth: 10,
        );
      },
      separatorBuilder: (_, __) => Divider(height: 0),
      itemCount: logs.length,
    );
  }
}

class _LogListShimmer extends StatelessWidget {
  const _LogListShimmer();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      itemBuilder: (_, __) => ListTile(
        leading: Bone.circle(size: 20),
        title: Bone.text(words: 3),
        subtitle: Bone.text(words: 1),
      ),
      separatorBuilder: (_, __) => Divider(height: 5, thickness: 0.5),
      itemCount: 15,
    );
  }
}

class _LogListEmpty extends StatelessWidget {
  const _LogListEmpty();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Symbols.comments_disabled_rounded,
            size: 50,
            color: context.colorScheme.primary,
          ),
          const SizedGap.mh(),
          Text(context.t.logs.no_logs),
        ],
      ),
    );
  }
}
