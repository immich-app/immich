import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/in_app_logger_message.model.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:intl/intl.dart';

class AppLogPage extends ConsumerWidget {
  const AppLogPage({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logService = ImmichLogger('AppLogPage');

    Widget buildLeadingIcon(ImmichLogLevel type) {
      switch (type) {
        case ImmichLogLevel.info:
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(5),
            ),
          );
        case ImmichLogLevel.error:
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Colors.redAccent,
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

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Logs",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Icons.ios_share_rounded,
              color: Theme.of(context).primaryColor,
              semanticLabel: "Share logs",
              size: 24.0,
            ),
            onPressed: () {
              logService.shareLogs();
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
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white70
                : Colors.grey[500],
          );
        },
        itemCount: logService.messages.length,
        itemBuilder: (context, index) {
          var logMessage = logService.messages[index];
          return ListTile(
            minLeadingWidth: 10,
            title: Text(
              logMessage.message,
              style: const TextStyle(fontSize: 13.0),
            ),
            subtitle: Text(
              "Created at ${DateFormat("HH:mm:ss.SSS").format(logMessage.createdAt)}",
              style: const TextStyle(fontSize: 12.0, color: Colors.grey),
            ),
            leading: buildLeadingIcon(logMessage.level),
          );
        },
      ),
    );
  }
}
