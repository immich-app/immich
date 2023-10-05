import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:immich_mobile/shared/ui/confirm_dialog.dart';

class LocationServiceDisabledDialog extends ConfirmDialog {
  LocationServiceDisabledDialog({Key? key})
      : super(
          key: key,
          title: 'map_location_service_disabled_title'.tr(),
          content: 'map_location_service_disabled_content'.tr(),
          cancel: 'map_location_dialog_cancel'.tr(),
          ok: 'map_location_dialog_yes'.tr(),
          onOk: () async {
            await Geolocator.openLocationSettings();
          },
        );
}

class LocationPermissionDisabledDialog extends ConfirmDialog {
  LocationPermissionDisabledDialog({Key? key})
      : super(
          key: key,
          title: 'map_no_location_permission_title'.tr(),
          content: 'map_no_location_permission_content'.tr(),
          cancel: 'map_location_dialog_cancel'.tr(),
          ok: 'map_location_dialog_yes'.tr(),
          onOk: () {},
        );
}
