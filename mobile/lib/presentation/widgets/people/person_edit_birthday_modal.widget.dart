import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:scroll_date_picker/scroll_date_picker.dart';

class DriftPersonBirthdayEditForm extends ConsumerStatefulWidget {
  final DriftPerson person;

  const DriftPersonBirthdayEditForm({super.key, required this.person});

  @override
  ConsumerState<DriftPersonBirthdayEditForm> createState() => _DriftPersonNameEditFormState();
}

class _DriftPersonNameEditFormState extends ConsumerState<DriftPersonBirthdayEditForm> {
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.person.birthDate ?? DateTime.now();
  }

  void saveBirthday() async {
    try {
      final result = await ref.read(driftPeopleServiceProvider).updateBrithday(widget.person.id, _selectedDate);

      if (result != 0) {
        ref.invalidate(driftGetAllPeopleProvider);
        context.pop<DateTime>(_selectedDate);
      }
    } catch (error) {
      debugPrint('Error updating birthday: $error');

      if (!context.mounted) {
        return;
      }

      ImmichToast.show(
        context: context,
        msg: 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        "edit_birthday".t(context: context),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: SizedBox(
        width: double.maxFinite,
        height: 300,
        child: ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(16.0)),
          child: ScrollDatePicker(
            options: DatePickerOptions(
              backgroundColor: context.colorScheme.surfaceContainerHigh,
              itemExtent: 50,
              diameterRatio: 5,
            ),
            scrollViewOptions: DatePickerScrollViewOptions(
              day: ScrollViewDetailOptions(
                isLoop: false,
                margin: const EdgeInsets.all(12),
                selectedTextStyle: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              month: ScrollViewDetailOptions(
                isLoop: false,
                margin: const EdgeInsets.all(12),
                selectedTextStyle: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              year: ScrollViewDetailOptions(
                isLoop: false,
                margin: const EdgeInsets.all(12),
                selectedTextStyle: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            selectedDate: _selectedDate,
            locale: context.locale,
            minimumDate: DateTime(1800, 1, 1),
            onDateTimeChanged: (DateTime value) {
              setState(() {
                _selectedDate = value;
              });
            },
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(null),
          child: Text(
            "cancel",
            style: TextStyle(color: Colors.red[300], fontWeight: FontWeight.bold),
          ).tr(),
        ),
        TextButton(
          onPressed: () => saveBirthday(),
          child: Text(
            "save",
            style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ],
    );
  }
}
