import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';

class GroupDividerTitle extends ConsumerWidget {
  const GroupDividerTitle({
    super.key,
    required this.text,
    required this.multiselectEnabled,
    required this.onSelect,
    required this.onDeselect,
    required this.selected,
  });

  final String text;
  final bool multiselectEnabled;
  final Function onSelect;
  final Function onDeselect;
  final bool selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupByIndex = ref.watch(groupAssetsBySettingProvider).valueOrNull ?? GroupAssetsBy.day.index;
    final groupBy = GroupAssetsBy.values[groupByIndex];

    void handleTitleIconClick() {
      ref.read(hapticFeedbackProvider.notifier).heavyImpact();
      if (selected) {
        onDeselect();
      } else {
        onSelect();
      }
    }

    return Padding(
      padding: EdgeInsets.only(
        top: groupBy == GroupAssetsBy.month ? 32.0 : 16.0,
        bottom: 16.0,
        left: 12.0,
        right: 12.0,
      ),
      child: Row(
        children: [
          Text(
            text,
            style: groupBy == GroupAssetsBy.month
                ? context.textTheme.bodyLarge?.copyWith(fontSize: 24.0)
                : context.textTheme.labelLarge?.copyWith(
                    color: context.textTheme.labelLarge?.color?.withAlpha(250),
                    fontWeight: FontWeight.w500,
                  ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: handleTitleIconClick,
            child: multiselectEnabled && selected
                ? Icon(
                    Icons.check_circle_rounded,
                    color: context.primaryColor,
                    semanticLabel: "unselect_all_in".tr(namedArgs: {"group": text}),
                  )
                : Icon(
                    Icons.check_circle_outline_rounded,
                    color: context.colorScheme.onSurfaceSecondary,
                    semanticLabel: "select_all_in".tr(namedArgs: {"group": text}),
                  ),
          ),
        ],
      ),
    );
  }
}
