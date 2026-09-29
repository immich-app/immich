import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_ui/src/constants.dart';
import 'package:immich_ui/src/internal.dart';

class ImmichMenu extends StatefulWidget {
  final List<Widget> children;
  final MenuAnchorChildBuilder builder;
  final MenuStyle? style;
  final bool consumeOutsideTap;
  final Widget? child;

  const ImmichMenu({
    super.key,
    required this.children,
    required this.builder,
    this.style,
    this.consumeOutsideTap = false,
    this.child,
  });

  @override
  State<ImmichMenu> createState() => _ImmichMenuState();
}

class _ImmichMenuState extends State<ImmichMenu> {
  final _controller = MenuController();

  @override
  Widget build(BuildContext context) {
    return _ImmichMenuScope(
      controller: _controller,
      child: MenuAnchor(
        controller: _controller,
        style: widget.style,
        consumeOutsideTap: widget.consumeOutsideTap,
        menuChildren: widget.children,
        builder: widget.builder,
        child: widget.child,
      ),
    );
  }
}

class _ImmichMenuScope extends InheritedWidget {
  final MenuController controller;

  const _ImmichMenuScope({required this.controller, required super.child});

  static MenuController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_ImmichMenuScope>()?.controller;

  @override
  bool updateShouldNotify(_ImmichMenuScope oldWidget) => controller != oldWidget.controller;
}

class ImmichMenuItem extends StatefulWidget {
  final IconData icon;
  final String label;
  final FutureOr<void> Function() onPressed;
  final bool disabled;

  const ImmichMenuItem({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
    this.disabled = false,
  });

  @override
  State<ImmichMenuItem> createState() => _ImmichMenuItemState();
}

class _ImmichMenuItemState extends State<ImmichMenuItem> {
  Future<void> _onPressed(MenuController? controller) async {
    try {
      await widget.onPressed();
    } finally {
      controller?.close();
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = _ImmichMenuScope.maybeOf(context);
    return MenuItemButton(
      onPressed: widget.disabled ? null : () => _onPressed(controller),
      closeOnActivate: controller == null,
      style: MenuItemButton.styleFrom(
        foregroundColor: context.colorOverride,
        alignment: .centerLeft,
        padding: const .symmetric(horizontal: ImmichSpacing.lg, vertical: ImmichSpacing.md),
      ),
      leadingIcon: Icon(widget.icon, size: ImmichIconSize.sm),
      child: Text(widget.label, style: const .new(fontSize: ImmichTextSize.body)),
    );
  }
}
