import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/drag_sheet.dart';

class AdvancedBottomSheet extends HookConsumerWidget {
  final Asset assetDetail;

  const AdvancedBottomSheet({Key? key, required this.assetDetail})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      child: Card(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(15),
            topRight: Radius.circular(15),
          ),
        ),
        margin: const EdgeInsets.all(0),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 8.0),
          child: LayoutBuilder(
            builder: (ctx, constraints) {
              // One column
              return Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 15, bottom: 10),
                    child: CustomDraggingHandle(),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: TextButton.icon(
                      label: Text(
                        "ADVANCED INFO",
                        style: context.textTheme.displaySmall,
                      ),
                      icon: Icon(
                        Icons.copy,
                        size: 16.0,
                        color: context.primaryColor,
                      ),
                      onPressed: () {
                        Clipboard.setData(
                          ClipboardData(text: assetDetail.toString()),
                        ).then((_) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(
                              content: Text("Copied to clipboard"),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        });
                      },
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15.0),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: ListView(
                        shrinkWrap: true,
                        children: [
                          SelectableText(
                            assetDetail.toString(),
                            style: const TextStyle(
                              fontSize: 12.0,
                              fontWeight: FontWeight.bold,
                              fontFamily: "Inconsolata",
                            ),
                            showCursor: true,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32.0),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
