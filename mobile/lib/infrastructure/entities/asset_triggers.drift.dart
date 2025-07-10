// dart format width=80
// ignore_for_file: type=lint
import 'package:drift/drift.dart' as i0;

i0.Trigger get trLocalAssetUpdateChecksumSetIds => i0.Trigger(
    'CREATE TRIGGER IF NOT EXISTS tr_local_asset_update_checksum_set_ids AFTER UPDATE OF checksum ON local_asset_entity WHEN NEW.checksum IS NOT NULL BEGIN UPDATE local_asset_entity SET remote_id = (SELECT id FROM remote_asset_entity WHERE checksum = NEW.checksum LIMIT 1) WHERE id = NEW.id;UPDATE remote_asset_entity SET local_id = (SELECT id FROM local_asset_entity WHERE checksum = NEW.checksum ORDER BY id ASC LIMIT 1) WHERE checksum = NEW.checksum;END',
    'tr_local_asset_update_checksum_set_ids');
i0.Trigger get trLocalAssetUpdateOldChecksumSetRemoteAssetLocalId => i0.Trigger(
    'CREATE TRIGGER IF NOT EXISTS tr_local_asset_update_old_checksum_set_remote_asset_local_id AFTER UPDATE OF checksum ON local_asset_entity WHEN OLD.checksum IS NOT NULL BEGIN UPDATE remote_asset_entity SET local_id = (SELECT id FROM local_asset_entity WHERE checksum = OLD.checksum ORDER BY id ASC LIMIT 1) WHERE checksum = OLD.checksum;END',
    'tr_local_asset_update_old_checksum_set_remote_asset_local_id');
i0.Trigger get trLocalAssetDeleteUpdateRemoteAssetLocalId => i0.Trigger(
    'CREATE TRIGGER IF NOT EXISTS tr_local_asset_delete_update_remote_asset_local_id AFTER DELETE ON local_asset_entity WHEN OLD.checksum IS NOT NULL BEGIN UPDATE remote_asset_entity SET local_id = (SELECT id FROM local_asset_entity WHERE checksum = OLD.checksum ORDER BY id ASC LIMIT 1) WHERE checksum = OLD.checksum;END',
    'tr_local_asset_delete_update_remote_asset_local_id');
i0.Trigger get trRemoteAssetInsertSetLocalId => i0.Trigger(
    'CREATE TRIGGER IF NOT EXISTS tr_remote_asset_insert_set_local_id AFTER INSERT ON remote_asset_entity BEGIN UPDATE remote_asset_entity SET local_id = (SELECT id FROM local_asset_entity WHERE checksum = NEW.checksum ORDER BY id ASC LIMIT 1) WHERE id = NEW.id;UPDATE local_asset_entity SET remote_id = NEW.id WHERE checksum = NEW.checksum;END',
    'tr_remote_asset_insert_set_local_id');
