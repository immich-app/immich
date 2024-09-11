import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';

class SettingsSwitchListTile extends StatelessWidget {
  final ValueNotifier<bool> valueNotifier;
  final String title;
  final bool enabled;
  final String? subtitle;
  final IconData? icon;
  final Function(bool)? onChanged;
  final EdgeInsets? contentPadding;
  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;

  const SettingsSwitchListTile({
    required this.valueNotifier,
    required this.title,
    this.subtitle,
    this.icon,
    this.enabled = true,
    this.onChanged,
    this.contentPadding = const EdgeInsets.symmetric(horizontal: 20),
    this.titleStyle,
    this.subtitleStyle,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    void onSwitchChanged(bool value) {
      if (!enabled) return;

      valueNotifier.value = value;
      onChanged?.call(value);
    }

    return SwitchListTile.adaptive(
      contentPadding: contentPadding,
      selectedTileColor: enabled ? null : context.themeData.disabledColor,
      value: valueNotifier.value,
      onChanged: onSwitchChanged,
      activeColor:
          enabled ? context.primaryColor : context.themeData.disabledColor,
      dense: true,
      secondary: icon != null
          ? Icon(
              icon!,
              color: valueNotifier.value ? context.primaryColor : null,
            )
          : null,
      title: Text(
        title,
        style: titleStyle ??
            context.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w500,
              color: enabled ? null : context.themeData.disabledColor,
              height: 1.5,
            ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle!,
              style: subtitleStyle ??
                  context.textTheme.bodyMedium?.copyWith(
                    color: enabled
                        ? context.colorScheme.onSurfaceSecondary
                        : context.themeData.disabledColor,
                  ),
            )
          : null,
    );
  }
}
