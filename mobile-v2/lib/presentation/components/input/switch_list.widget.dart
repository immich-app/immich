import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/app_setting.model.dart';
import 'package:immich_mobile/domain/services/app_setting.service.dart';
import 'package:immich_mobile/service_locator.dart';

class ImSwitchListTile<T> extends StatefulWidget {
  const ImSwitchListTile(
    this.setting, {
    super.key,
    this.fromAppSetting,
    this.toAppSetting,
  }) : assert(T == bool || (fromAppSetting != null && toAppSetting != null),
            "Setting is not a boolean and a from / to App setting is not provided");

  final AppSetting<T> setting;

  /// Converts the type T to a boolean to use in a switch
  final bool Function(T value)? fromAppSetting;

  /// Converts the boolean back to the type T to be stored in the app setting. Return null to not update the DB but to
  /// retain the previous value
  final T? Function(bool state)? toAppSetting;

  @override
  State createState() => _ImSwitchListTileState<T>();
}

class _ImSwitchListTileState<T> extends State<ImSwitchListTile<T>> {
  // Actual switch list state
  late bool isEnabled;
  final AppSettingService _appSettingService = di();

  Future<void> set(bool enabled) async {
    if (isEnabled == enabled) return;

    final value = T != bool ? widget.toAppSetting!(enabled) : enabled as T;
    if (value != null &&
        await _appSettingService.setSetting(widget.setting, value) &&
        context.mounted) {
      setState(() {
        isEnabled = enabled;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _appSettingService.getSetting(widget.setting).then((value) {
      if (context.mounted) {
        setState(() {
          isEnabled = T != bool ? widget.fromAppSetting!(value) : value as bool;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      value: isEnabled,
      onChanged: (value) => set(value),
    );
  }
}
