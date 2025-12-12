import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class SheetTile extends ConsumerWidget {
  final String title;
  final Widget? leading;
  final Widget? trailing;
  final String? subtitle;
  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;
  final VoidCallback? onTap;

  const SheetTile({
    super.key,
    required this.title,
    this.titleStyle,
    this.leading,
    this.subtitle,
    this.subtitleStyle,
    this.trailing,
    this.onTap,
  });

  void copyTitle(BuildContext context, WidgetRef ref) {
    Clipboard.setData(ClipboardData(text: title));
    ImmichToast.show(
      context: context,
      msg: 'copied_to_clipboard'.t(context: context),
      toastType: ToastType.info,
    );
    ref.read(hapticFeedbackProvider.notifier).selectionClick();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Widget titleWidget;
    if (leading == null) {
      titleWidget = LimitedBox(
        maxWidth: double.infinity,
        child: Text(title, style: titleStyle),
      );
    } else {
      titleWidget = Container(
        width: double.infinity,
        padding: const EdgeInsets.only(left: 15),
        child: Text(title, style: titleStyle),
      );
    }

    final Widget? subtitleWidget;
    if (leading == null && subtitle != null) {
      subtitleWidget = Text(subtitle!, style: subtitleStyle);
    } else if (leading != null && subtitle != null) {
      subtitleWidget = Padding(
        padding: const EdgeInsets.only(left: 15),
        child: Text(subtitle!, style: subtitleStyle),
      );
    } else {
      subtitleWidget = null;
    }

    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      title: GestureDetector(onLongPress: () => copyTitle(context, ref), child: titleWidget),
      titleAlignment: ListTileTitleAlignment.center,
      leading: leading,
      trailing: trailing,
      contentPadding: leading == null ? null : const EdgeInsets.only(left: 25),
      subtitle: subtitleWidget,
      onTap: onTap,
    );
  }
}
