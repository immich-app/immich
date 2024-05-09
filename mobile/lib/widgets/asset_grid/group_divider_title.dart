import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';

class GroupDividerTitle extends HookConsumerWidget {
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
    final appSettingService = ref.watch(appSettingsServiceProvider);
    final groupBy = useState(GroupAssetsBy.day);

    useEffect(
      () {
        groupBy.value = GroupAssetsBy.values[
            appSettingService.getSetting<int>(AppSettingsEnum.groupAssetsBy)];
        return null;
      },
      [],
    );

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
        top: groupBy.value == GroupAssetsBy.month ? 32.0 : 16.0,
        bottom: 16.0,
        left: 12.0,
        right: 12.0,
      ),
      child: Row(
        children: [
          Text(
            text,
            style: groupBy.value == GroupAssetsBy.month
                ? context.textTheme.bodyLarge?.copyWith(
                    fontSize: 24.0,
                  )
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
                  )
                : const Icon(
                    Icons.check_circle_outline_rounded,
                    color: Colors.grey,
                  ),
          ),
        ],
      ),
    );
  }
}
