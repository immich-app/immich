import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/app_icons.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';

class AppIconSetting extends HookConsumerWidget {
  const AppIconSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appIconApi = ref.watch(appIconApiProvider);
    final selectedIcon = useState(AppIconVariant.classic);

    useEffect(() {
      appIconApi
          .getAppIcon()
          .then((id) {
            selectedIcon.value = AppIconVariant.fromId(id);
          })
          .catchError((_) {});
      return null;
    }, []);

    Future<void> onIconSelected(AppIconVariant variant) async {
      if (variant == selectedIcon.value) {
        return;
      }

      try {
        await appIconApi.setAppIcon(variant.name);
        selectedIcon.value = variant;
      } catch (_) {
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: 'app_icon_change_failed'.t(context: context),
            toastType: ToastType.error,
          );
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "app_icon_title".t(context: context),
          icon: Icons.apps_outlined,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Text(
            "app_icon_subtitle".t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceVariant),
          ),
        ),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          children: [
            for (final variant in AppIconVariant.values)
              _AppIconTile(
                variant: variant,
                isSelected: variant == selectedIcon.value,
                onTap: () => onIconSelected(variant),
              ),
          ],
        ),
      ],
    );
  }
}

class _AppIconTile extends StatelessWidget {
  const _AppIconTile({required this.variant, required this.isSelected, required this.onTap});

  final AppIconVariant variant;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: const BorderRadius.all(Radius.circular(16)),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.all(Radius.circular(16)),
                  border: Border.all(
                    color: isSelected ? context.colorScheme.primary : context.colorScheme.outlineVariant,
                    width: isSelected ? 3 : 1,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(13)),
                  child: Image.asset(variant.assetPath, width: 64, height: 64),
                ),
              ),
              if (isSelected)
                Positioned(
                  right: 2,
                  bottom: 2,
                  child: DecoratedBox(
                    decoration: BoxDecoration(color: context.colorScheme.primary, shape: BoxShape.circle),
                    child: Padding(
                      padding: const EdgeInsets.all(2),
                      child: Icon(Icons.check, size: 12, color: context.colorScheme.onPrimary),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            variant.translationKey.t(context: context),
            style: context.textTheme.labelMedium?.copyWith(
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? context.colorScheme.primary : null,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
