import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class DriftActivityTextField extends ConsumerStatefulWidget {
  final bool isEnabled;
  final String? likeId;
  final Function(String) onSubmit;
  final Function()? onKeyboardFocus;

  const DriftActivityTextField({
    required this.onSubmit,
    this.isEnabled = true,
    this.likeId,
    this.onKeyboardFocus,
    super.key,
  });

  @override
  ConsumerState<DriftActivityTextField> createState() => _DriftActivityTextFieldState();
}

class _DriftActivityTextFieldState extends ConsumerState<DriftActivityTextField> {
  late FocusNode inputFocusNode;
  late TextEditingController inputController;
  bool sendEnabled = false;

  @override
  void initState() {
    super.initState();
    inputController = TextEditingController();
    inputFocusNode = FocusNode();

    inputFocusNode.requestFocus();

    inputFocusNode.addListener(() {
      if (inputFocusNode.hasFocus) {
        widget.onKeyboardFocus?.call();
      }
    });

    inputController.addListener(() {
      setState(() {
        sendEnabled = inputController.text.trim().isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    inputController.dispose();
    inputFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    // Pass text to callback and reset controller
    void onEditingComplete() {
      if (inputController.text.trim().isEmpty) {
        return;
      }

      widget.onSubmit(inputController.text);
      inputController.clear();
      inputFocusNode.unfocus();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: TextField(
        controller: inputController,
        enabled: widget.isEnabled,
        focusNode: inputFocusNode,
        textInputAction: TextInputAction.send,
        autofocus: false,
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 12), // Adjust as needed
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
          prefixIcon: user != null
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: UserCircleAvatar(user: user, size: 30, radius: 15),
                )
              : null,
          suffixIcon: IconButton(
            onPressed: sendEnabled ? onEditingComplete : null,
            icon: const Icon(Icons.send),
            iconSize: 24,
            color: context.primaryColor,
            disabledColor: context.colorScheme.secondaryContainer,
          ),
          hintText: !widget.isEnabled ? 'shared_album_activities_input_disable'.tr() : 'say_something'.tr(),
          hintStyle: TextStyle(fontWeight: FontWeight.normal, fontSize: 14, color: Colors.grey[600]),
        ),
        onEditingComplete: onEditingComplete,
        onTapOutside: (_) => inputFocusNode.unfocus(),
      ),
    );
  }
}
