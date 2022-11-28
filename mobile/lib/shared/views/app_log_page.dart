import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/immich_logger.provider.dart';
import 'package:intl/intl.dart';

class AppLogPage extends HookConsumerWidget {
  const AppLogPage({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logMessages = ref.watch(immichLoggerProvider);

    Widget colorStatus(Color color) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(5),
            ),
          ),
        ],
      );
    }

    Widget buildLeadingIcon(String level) {
      switch (level) {
        case "INFO":
          return colorStatus(Theme.of(context).primaryColor);
        case "SEVERE":
          return colorStatus(Colors.redAccent);
        case "WARNING":
          return colorStatus(Colors.orangeAccent);
        default:
          return colorStatus(Colors.grey);
      }
    }

    getTileColor(String level) {
      switch (level) {
        case "INFO":
          return Colors.transparent;
        case "SEVERE":
          return Theme.of(context).brightness == Brightness.dark
              ? Colors.redAccent.withOpacity(0.2)
              : Colors.redAccent.withOpacity(0.075);
        case "WARNING":
          return Theme.of(context).brightness == Brightness.dark
              ? Colors.orangeAccent.withOpacity(0.2)
              : Colors.orangeAccent.withOpacity(0.075);
        default:
          return Theme.of(context).primaryColor.withOpacity(0.1);
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Logs - ${logMessages.length}",
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
              color: Theme.of(context).primaryColor,
              semanticLabel: "Clear logs",
              size: 20.0,
            ),
            onPressed: () {
              ref.watch(immichLoggerProvider.notifier).clearLogs();
            },
          ),
          IconButton(
            icon: Icon(
              Icons.share_rounded,
              color: Theme.of(context).primaryColor,
              semanticLabel: "Share logs",
              size: 20.0,
            ),
            onPressed: () {
              ref.watch(immichLoggerProvider.notifier).shareLogs();
            },
          ),
        ],
        leading: IconButton(
          onPressed: () {
            AutoRouter.of(context).pop();
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
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white70
                : Colors.grey[500],
          );
        },
        itemCount: logMessages.length,
        itemBuilder: (context, index) {
          var logMessage = logMessages[index];
          return ListTile(
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
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.white70
                          : Colors.grey[500],
                    ),
                  ),
                  TextSpan(
                    text: logMessage.message,
                  ),
                ],
              ),
              style: const TextStyle(
                fontSize: 14.0,
                fontFamily: "Inconsolata",
              ),
            ),
            subtitle: Text(
              "[${logMessage.context1}] Logged on ${DateFormat("HH:mm:ss.SSS").format(logMessage.createdAt)}",
              style: TextStyle(
                fontSize: 12.0,
                color: Colors.grey[600],
              ),
            ),
            leading: buildLeadingIcon(logMessage.level),
          );
        },
      ),
    );
  }
}
