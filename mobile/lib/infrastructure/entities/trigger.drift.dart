// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;

i0.Trigger get trRemoteAssetDeleteCascade => i0.Trigger(
    'CREATE TRIGGER IF NOT EXISTS tr_remote_asset_delete_cascade AFTER DELETE ON remote_asset_entity BEGIN DELETE FROM exif_entity WHERE asset_id = OLD.id;END',
    'tr_remote_asset_delete_cascade');
i0.Trigger get trLocalAssetDeleteCascade => i0.Trigger(
    'CREATE TRIGGER IF NOT EXISTS tr_local_asset_delete_cascade AFTER DELETE ON local_asset_entity BEGIN DELETE FROM exif_entity WHERE asset_id = OLD.id;END',
    'tr_local_asset_delete_cascade');
