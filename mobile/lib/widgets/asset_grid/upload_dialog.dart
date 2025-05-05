import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

class UploadDialog extends ConfirmDialog {
  final Function onUpload;

  const UploadDialog({super.key, required this.onUpload})
      : super(
          title: 'upload_dialog_title',
          content: 'upload_dialog_info',
          cancel: 'cancel',
          ok: 'upload',
          onOk: onUpload,
        );
}
