import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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

    Widget buildLeadingIcon(String level) {
      switch (level) {
        case "INFO":
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(5),
            ),
          );
        case "SEVERE":
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Colors.redAccent,
              borderRadius: BorderRadius.circular(5),
            ),
          );
        case "WARNING":
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Colors.orangeAccent,
              borderRadius: BorderRadius.circular(5),
            ),
          );
        default:
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(5),
            ),
          );
      }
    }

    getTileColor(String level) {
      switch (level) {
        case "INFO":
          return Colors.transparent;
        case "SEVERE":
          return Colors.redAccent.withOpacity(0.075);
        case "WARNING":
          return Colors.orangeAccent.withOpacity(0.075);
        default:
          return Theme.of(context).primaryColor.withOpacity(0.1);
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
              color: Theme.of(context).primaryColor,
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
              color: Theme.of(context).primaryColor,
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
        itemCount: logMessages.value.length,
        itemBuilder: (context, index) {
          var logMessage = logMessages.value[index];
          return ListTile(
            visualDensity: VisualDensity.compact,
            dense: true,
            tileColor: getTileColor(logMessage.level),
            minLeadingWidth: 10,
            title: Text(
              logMessage.message,
              style: const TextStyle(fontSize: 14.0, fontFamily: "Inconsolata"),
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
