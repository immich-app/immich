// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;

i0.Trigger get deleteUploadErrorOnRemoteInsert => i0.Trigger(
  'CREATE TRIGGER delete_upload_error_on_remote_insert AFTER INSERT ON remote_asset_entity BEGIN DELETE FROM local_asset_upload_entity WHERE asset_id IN (SELECT lae.id FROM local_asset_entity AS lae WHERE lae.checksum = NEW.checksum);END',
  'delete_upload_error_on_remote_insert',
);
