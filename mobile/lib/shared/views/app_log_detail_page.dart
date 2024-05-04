import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/logger_message.entity.dart';
import 'package:flutter/services.dart';

@RoutePage()
class AppLogDetailPage extends HookConsumerWidget {
  const AppLogDetailPage({super.key, required this.logMessage});

  final LoggerMessage logMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var isDarkTheme = context.isDarkTheme;

    buildTextWithCopyButton(String header, String text) {
      return Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Text(
                    header,
                    style: TextStyle(
                      fontSize: 12.0,
                      color: context.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: text)).then((_) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            "Copied to clipboard",
                            style: context.textTheme.bodyLarge?.copyWith(
                              color: context.primaryColor,
                            ),
                          ),
                        ),
                      );
                    });
                  },
                  icon: Icon(
                    Icons.copy,
                    size: 16.0,
                    color: context.primaryColor,
                  ),
                ),
              ],
            ),
            Container(
              decoration: BoxDecoration(
                color: isDarkTheme ? Colors.grey[900] : Colors.grey[200],
                borderRadius: BorderRadius.circular(15.0),
              ),
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: SelectableText(
                  text,
                  style: const TextStyle(
                    fontSize: 12.0,
                    fontWeight: FontWeight.bold,
                    fontFamily: "Inconsolata",
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    buildLogContext1(String context1) {
      return Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Text(
                "FROM",
                style: TextStyle(
                  fontSize: 12.0,
                  color: context.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: isDarkTheme ? Colors.grey[900] : Colors.grey[200],
                borderRadius: BorderRadius.circular(15.0),
              ),
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: SelectableText(
                  context1.toString(),
                  style: const TextStyle(
                    fontSize: 12.0,
                    fontWeight: FontWeight.bold,
                    fontFamily: "Inconsolata",
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Log Detail"),
      ),
      body: SafeArea(
        child: ListView(
          children: [
            buildTextWithCopyButton("MESSAGE", logMessage.message),
            if (logMessage.details != null)
              buildTextWithCopyButton("DETAILS", logMessage.details.toString()),
            if (logMessage.context1 != null)
              buildLogContext1(logMessage.context1.toString()),
            if (logMessage.context2 != null)
              buildTextWithCopyButton(
                "STACK TRACE",
                logMessage.context2.toString(),
              ),
          ],
        ),
      ),
    );
  }
}
