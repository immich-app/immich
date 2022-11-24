import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';

class AppLogPage extends ConsumerWidget {
  const AppLogPage({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logService = ImmichLogger('AppLogPage');

    Widget buildLeadingIcon(String type) {
      switch (type) {
        case "info":
          return Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor,
              borderRadius: BorderRadius.circular(5),
            ),
          );
        case "error":
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
          return const Divider();
        },
        itemCount: logService.messages.length,
        itemBuilder: (context, index) {
          var logMessage = logService.messages[index];
          return ListTile(
            visualDensity: VisualDensity.compact,
            minVerticalPadding: 8,
            minLeadingWidth: 10,
            title: Text(
              logMessage.message,
              style: const TextStyle(fontSize: 14.0),
            ),
            subtitle: Text(
              logMessage.createdAt.toIso8601String(),
            ),
            leading: buildLeadingIcon(logMessage.type),
          );
        },
      ),
    );
  }
}
