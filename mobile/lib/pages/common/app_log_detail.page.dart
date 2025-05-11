import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

@RoutePage()
class AppLogDetailPage extends HookConsumerWidget {
  const AppLogDetailPage({super.key, required this.logMessage});

  final LogMessage logMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                      context.scaffoldMessenger.showSnackBar(
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
                color: context.colorScheme.surfaceContainerHigh,
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
                color: context.colorScheme.surfaceContainerHigh,
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
            if (logMessage.error != null)
              buildTextWithCopyButton("DETAILS", logMessage.error.toString()),
            if (logMessage.logger != null)
              buildLogContext1(logMessage.logger.toString()),
            if (logMessage.stack != null)
              buildTextWithCopyButton(
                "STACK TRACE",
                logMessage.stack.toString(),
              ),
          ],
        ),
      ),
    );
  }
}
