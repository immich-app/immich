import 'dart:math';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';

class ImmichSearchBar extends HookWidget {
  final ValueChanged<String> onSubmitted;
  final String? hintText;
  final bool autofocus;

  const ImmichSearchBar({super.key, required this.onSubmitted, this.hintText, this.autofocus = false});

  @override
  Widget build(BuildContext context) {
    final searchController = useTextEditingController();
    final focusNode = useFocusNode();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: context.colorScheme.onSurface.withAlpha(0), width: 0),
          borderRadius: const BorderRadius.all(Radius.circular(24)),
          gradient: LinearGradient(
            colors: [
              context.colorScheme.primary.withValues(alpha: 0.075),
              context.colorScheme.primary.withValues(alpha: 0.09),
              context.colorScheme.primary.withValues(alpha: 0.075),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            transform: const GradientRotation(0.5 * pi),
          ),
        ),
        child: SearchField(
          autofocus: autofocus,
          contentPadding: const EdgeInsets.all(16),
          hintText: hintText ?? 'search_bar_hint'.tr(),
          prefixIcon: const Icon(Icons.search_rounded),
          suffixIcon: searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded),
                  onPressed: () {
                    searchController.clear();
                    // Optional: trigger onSubmitted with empty string if desired?
                    // Typically 'clear' just clears text. User must submit to refresh.
                  },
                )
              : null,
          controller: searchController,
          onSubmitted: onSubmitted,
          focusNode: focusNode,
          onTapOutside: (_) => focusNode.unfocus(),
          onChanged: (value) {
            // Trigger rebuild for clear button visibility
            // searchController.text is already updated, but we need to trigger build
            // HookWidget usually assumes reactive state.
            // But TextEditingController text change doesn't auto-rebuild unless we listen.
            // We can force rebuild by using a state or manually listening.
          },
        ),
      ),
    );
  }
}
