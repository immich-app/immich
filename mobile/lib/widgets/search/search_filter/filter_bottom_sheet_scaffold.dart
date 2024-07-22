import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class FilterBottomSheetScaffold extends StatelessWidget {
  const FilterBottomSheetScaffold({
    super.key,
    required this.child,
    required this.onSearch,
    required this.onClear,
    required this.title,
    this.expanded,
  });

  final bool? expanded;
  final String title;
  final Widget child;
  final Function() onSearch;
  final Function() onClear;

  @override
  Widget build(BuildContext context) {
    buildChildWidget() {
      if (expanded != null && expanded == true) {
        return Expanded(child: child);
      }
      return child;
    }

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              title,
              style: context.textTheme.headlineSmall,
            ),
          ),
          buildChildWidget(),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: () {
                    onClear();
                    Navigator.of(context).pop();
                  },
                  child: const Text('action_common_clear').tr(),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    onSearch();
                    Navigator.of(context).pop();
                  },
                  child: const Text('search_filter_apply').tr(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
