import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';
import 'package:intl/intl.dart';

@RoutePage()
class AppLogPage extends HookConsumerWidget {
  const AppLogPage({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final immichLogger = LogService.I;
    final shouldReload = useState(false);
    final logMessages = useFuture(
      useMemoized(() => immichLogger.getMessages(), [shouldReload.value]),
    );

    Widget colorStatusIndicator(Color color) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
        ],
      );
    }

    Widget buildLeadingIcon(LogLevel level) => switch (level) {
          LogLevel.info => colorStatusIndicator(context.primaryColor),
          LogLevel.severe => colorStatusIndicator(Colors.redAccent),
          LogLevel.warning => colorStatusIndicator(Colors.orangeAccent),
          _ => colorStatusIndicator(Colors.grey),
        };

    Color getTileColor(LogLevel level) => switch (level) {
          LogLevel.info => Colors.transparent,
          LogLevel.severe => Colors.redAccent.withValues(alpha: 0.25),
          LogLevel.warning => Colors.orangeAccent.withValues(alpha: 0.25),
          _ => context.primaryColor.withValues(alpha: 0.1),
        };

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Logs",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ),
        scrolledUnderElevation: 1,
        elevation: 2,
        actions: [
          IconButton(
            icon: Icon(
              Icons.delete_outline_rounded,
              color: context.primaryColor,
              semanticLabel: "Clear logs",
              size: 20.0,
            ),
            onPressed: () {
              immichLogger.clearLogs();
              shouldReload.value = !shouldReload.value;
            },
          ),
          Builder(
            builder: (BuildContext iconContext) {
              return IconButton(
                icon: Icon(
                  Icons.share_rounded,
                  color: context.primaryColor,
                  semanticLabel: "Share logs",
                  size: 20.0,
                ),
                onPressed: () {
                  ImmichLogger.shareLogs(iconContext);
                },
              );
            },
          ),
        ],
        leading: IconButton(
          onPressed: () {
            context.maybePop();
          },
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20.0,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView.separated(
        separatorBuilder: (context, index) {
          return const Divider(height: 0);
        },
        itemCount: logMessages.data?.length ?? 0,
        itemBuilder: (context, index) {
          var logMessage = logMessages.data![index];
          return ListTile(
            onTap: () => context.pushRoute(
              AppLogDetailRoute(
                logMessage: logMessage,
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios_rounded),
            visualDensity: VisualDensity.compact,
            dense: true,
            tileColor: getTileColor(logMessage.level),
            minLeadingWidth: 10,
            title: Text(
              truncateLogMessage(logMessage.message, 4),
              style: TextStyle(
                fontSize: 14.0,
                color: context.colorScheme.onSurface,
                fontFamily: "Inconsolata",
              ),
            ),
            subtitle: Text(
              "at ${DateFormat("HH:mm:ss.SSS").format(logMessage.createdAt)} in ${logMessage.logger}",
              style: TextStyle(
                fontSize: 12.0,
                color: context.colorScheme.onSurfaceSecondary,
              ),
            ),
            leading: buildLeadingIcon(logMessage.level),
          );
        },
      ),
    );
  }

  /// Truncate the log message to a certain number of lines
  /// @param int maxLines - Max number of lines to truncate
  String truncateLogMessage(String message, int maxLines) {
    List<String> messageLines = message.split("\n");
    if (messageLines.length < maxLines) {
      return message;
    }
    return "${messageLines.sublist(0, maxLines).join("\n")} ...";
  }
}
