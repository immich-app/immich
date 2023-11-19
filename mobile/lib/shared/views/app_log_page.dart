import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/logger_message.model.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:intl/intl.dart';

class AppLogPage extends HookConsumerWidget {
  const AppLogPage({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final immichLogger = ImmichLogger();
    final logMessages = useState(immichLogger.messages);

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

    Widget buildLeadingIcon(LogLevel level) {
      switch (level) {
        case LogLevel.INFO:
          return colorStatusIndicator(context.primaryColor);
        case LogLevel.SEVERE:
          return colorStatusIndicator(context.redColor);
        case LogLevel.WARNING:
          return colorStatusIndicator(context.orangeColor);
        default:
          return colorStatusIndicator(
            context.colorScheme.onSurfaceVariant.withAlpha(150),
          );
      }
    }

    getTileColor(LogLevel level) {
      switch (level) {
        case LogLevel.INFO:
          return Colors.transparent;
        case LogLevel.SEVERE:
          return context.redColor.withAlpha(50);
        case LogLevel.WARNING:
          return context.orangeColor.withAlpha(50);
        default:
          return context.primaryColor.withAlpha(50);
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Logs - ${logMessages.value.length}",
          style: const TextStyle(
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
              logMessages.value = [];
            },
          ),
          IconButton(
            icon: Icon(
              Icons.share_rounded,
              color: context.primaryColor,
              semanticLabel: "Share logs",
              size: 20.0,
            ),
            onPressed: () {
              immichLogger.shareLogs();
            },
          ),
        ],
        leading: IconButton(
          onPressed: () {
            context.autoPop();
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
          return Divider(
            height: 0,
            color: context.themeData.dividerColor,
          );
        },
        itemCount: logMessages.value.length,
        itemBuilder: (context, index) {
          var logMessage = logMessages.value[index];
          return ListTile(
            onTap: () => context.autoPush(
              AppLogDetailRoute(
                logMessage: logMessage,
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios_rounded),
            visualDensity: VisualDensity.compact,
            dense: true,
            tileColor: getTileColor(logMessage.level),
            minLeadingWidth: 10,
            title: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: "#$index ",
                    style: TextStyle(
                      color: context.themeData.dividerColor,
                      fontSize: 14.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextSpan(
                    text: truncateLogMessage(logMessage.message, 4),
                    style: const TextStyle(
                      fontSize: 14.0,
                    ),
                  ),
                ],
              ),
              style: const TextStyle(fontSize: 14.0, fontFamily: "Inconsolata"),
            ),
            subtitle: Text(
              "[${logMessage.context1}] Logged on ${DateFormat("HH:mm:ss.SSS").format(logMessage.createdAt)}",
              style: TextStyle(
                fontSize: 12.0,
                color: context.themeData.hintColor,
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
