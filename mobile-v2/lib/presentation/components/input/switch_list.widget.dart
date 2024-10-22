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
  late bool _isEnabled;
  final AppSettingService _appSettingService = di();

  Future<void> _set(bool enabled) async {
    if (_isEnabled == enabled) return;

    final value = T == bool ? enabled as T : widget.toAppSetting!(enabled);
    if (value != null &&
        await _appSettingService.upsert(widget.setting, value) &&
        context.mounted) {
      setState(() {
        _isEnabled = enabled;
      });
    }
  }

  Future<void> _initSetting() async {
    final value = await _appSettingService.get(widget.setting);
    if (context.mounted) {
      setState(() {
        _isEnabled = T == bool ? value as bool : widget.fromAppSetting!(value);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _initSetting().ignore();
  }

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      value: _isEnabled,
      onChanged: (value) => unawaited(_set(value)),
    );
  }
}
