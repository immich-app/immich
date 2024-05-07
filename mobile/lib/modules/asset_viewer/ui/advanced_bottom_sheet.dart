import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class AdvancedBottomSheet extends HookConsumerWidget {
  final Asset assetDetail;

  const AdvancedBottomSheet({super.key, required this.assetDetail});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8.0),
        child: LayoutBuilder(
          builder: (context, constraints) {
            // One column
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Align(
                  child: Text(
                    "ADVANCED INFO",
                    style: TextStyle(fontSize: 12.0),
                  ),
                ),
                const SizedBox(height: 32.0),
                Container(
                  decoration: BoxDecoration(
                    color: context.isDarkTheme
                        ? Colors.grey[900]
                        : Colors.grey[200],
                    borderRadius: BorderRadius.circular(15.0),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.only(
                      right: 16.0,
                      left: 16,
                      top: 8,
                      bottom: 16,
                    ),
                    child: ListView(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        Align(
                          alignment: Alignment.centerRight,
                          child: IconButton(
                            onPressed: () {
                              Clipboard.setData(
                                ClipboardData(
                                  text: assetDetail.toString(),
                                ),
                              ).then((_) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      "Copied to clipboard",
                                      style:
                                          context.textTheme.bodyLarge?.copyWith(
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
                        ),
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
    );
  }
}
