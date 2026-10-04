"""Unit tests for the linking core of immich-family-dedup.py.

They use temporary directories only: no Immich instance, no database,
no Docker. The script has a dash in its name, so it is loaded by path.
"""

import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

CANDIDATES = [
    Path(__file__).parent / "immich-family-dedup.py",
    Path(__file__).parents[1] / "configs" / "immich" / "immich-family-dedup.py",
]
SCRIPT = next((p for p in CANDIDATES if p.exists()), CANDIDATES[0])


def load_script_module():
    spec = importlib.util.spec_from_file_location("immich_family_dedup", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


dedup = load_script_module()


def fake_stat(ino=1, dev=1, nlink=1, size=10):
    return os.stat_result((0o100644, ino, dev, nlink, 0, 0, size, 0, 0, 0))


class ClassifyPairTest(unittest.TestCase):
    def test_same_inode_is_already_linked(self):
        stat = fake_stat(ino=7, dev=2)
        self.assertIs(
            dedup.classify_pair(stat, fake_stat(ino=7, dev=2)),
            dedup.Outcome.ALREADY_LINKED,
        )

    def test_same_inode_on_other_device_is_not_linked(self):
        outcome = dedup.classify_pair(fake_stat(ino=7, dev=2), fake_stat(ino=7, dev=3))
        self.assertIs(outcome, dedup.Outcome.CROSS_DEVICE)

    def test_cross_device_is_skipped(self):
        outcome = dedup.classify_pair(fake_stat(ino=7, dev=2), fake_stat(ino=8, dev=3))
        self.assertIs(outcome, dedup.Outcome.CROSS_DEVICE)

    def test_size_mismatch_with_same_checksum_is_suspicious(self):
        outcome = dedup.classify_pair(
            fake_stat(ino=7, size=10), fake_stat(ino=8, size=11)
        )
        self.assertIs(outcome, dedup.Outcome.SIZE_MISMATCH)

    def test_same_size_distinct_inodes_can_link(self):
        outcome = dedup.classify_pair(
            fake_stat(ino=7, size=10), fake_stat(ino=8, size=10)
        )
        self.assertIs(outcome, dedup.Outcome.LINKED)


class DivergedTest(unittest.TestCase):
    def test_identical_stats_are_stable(self):
        self.assertFalse(dedup.diverged(fake_stat(ino=7, nlink=2), fake_stat(ino=7, nlink=2)))

    def test_inode_change_is_divergence(self):
        self.assertTrue(dedup.diverged(fake_stat(ino=7), fake_stat(ino=8)))

    def test_device_change_is_divergence(self):
        self.assertTrue(dedup.diverged(fake_stat(ino=7, dev=1), fake_stat(ino=7, dev=2)))

    def test_link_count_change_is_divergence(self):
        self.assertTrue(dedup.diverged(fake_stat(ino=7, nlink=1), fake_stat(ino=7, nlink=2)))

    def test_expected_link_count_delta_is_stable(self):
        before = fake_stat(ino=7, nlink=1)
        after = fake_stat(ino=7, nlink=2)
        self.assertFalse(dedup.diverged(before, after, nlink_delta=1))
        self.assertTrue(dedup.diverged(before, after))

    def test_unexpected_link_count_delta_is_divergence(self):
        before = fake_stat(ino=7, nlink=1)
        after = fake_stat(ino=7, nlink=3)
        self.assertTrue(dedup.diverged(before, after, nlink_delta=1))


class HostPathTest(unittest.TestCase):
    def test_maps_container_prefix_to_upload_root(self):
        self.assertEqual(
            dedup.host_path("/usr/src/app/upload/library/a.jpg", "/usr/src/app/upload", "/srv/immich/upload"),
            "/srv/immich/upload/library/a.jpg",
        )

    def test_rejects_paths_outside_the_prefix(self):
        with self.assertRaises(ValueError):
            dedup.host_path("/somewhere/else/a.jpg", "/usr/src/app/upload", "/srv/immich/upload")


class LinkPairTest(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)
        root = Path(self.tmpdir.name)
        self.canonical = root / "canonical" / "img.jpg"
        self.follower = root / "follower" / "img.jpg"
        self.canonical.parent.mkdir()
        self.follower.parent.mkdir()
        self.canonical.write_bytes(b"same-bytes")
        self.follower.write_bytes(b"same-bytes")

    def test_hardlinks_on_the_same_filesystem(self):
        outcome, saved = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=False)

        self.assertIs(outcome, dedup.Outcome.LINKED)
        self.assertEqual(saved, self.follower.stat().st_size)
        cst, fst = self.canonical.stat(), self.follower.stat()
        self.assertEqual(cst.st_ino, fst.st_ino)
        self.assertEqual(cst.st_dev, fst.st_dev)
        self.assertEqual(cst.st_nlink, 2)
        self.assertEqual(self.follower.read_bytes(), b"same-bytes")

    def test_dry_run_touches_nothing(self):
        outcome, saved = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=True)

        self.assertIs(outcome, dedup.Outcome.WOULD_LINK)
        self.assertEqual(saved, self.follower.stat().st_size)
        self.assertNotEqual(self.canonical.stat().st_ino, self.follower.stat().st_ino)
        self.assertEqual(self.follower.stat().st_nlink, 1)

    def test_missing_canonical_is_skipped(self):
        self.canonical.unlink()
        outcome, saved = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=False)

        self.assertIs(outcome, dedup.Outcome.MISSING_CANONICAL)
        self.assertEqual(saved, 0)
        self.assertTrue(self.follower.exists())

    def test_missing_follower_is_skipped(self):
        self.follower.unlink()
        outcome, saved = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=False)

        self.assertIs(outcome, dedup.Outcome.MISSING_FOLLOWER)
        self.assertEqual(saved, 0)
        self.assertTrue(self.canonical.exists())

    def test_size_mismatch_with_same_checksum_is_skipped(self):
        self.follower.write_bytes(b"different-length")
        outcome, saved = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=False)

        self.assertIs(outcome, dedup.Outcome.SIZE_MISMATCH)
        self.assertEqual(saved, 0)
        self.assertNotEqual(self.canonical.stat().st_ino, self.follower.stat().st_ino)
        self.assertEqual(self.follower.read_bytes(), b"different-length")

    def test_cross_filesystem_pair_is_skipped(self):
        real_stat = os.stat
        canonical, follower = str(self.canonical), str(self.follower)

        def stat_fn(path):
            st = real_stat(path)
            dev = st.st_dev if path == canonical else st.st_dev + 1
            return os.stat_result((st.st_mode, st.st_ino, dev, st.st_nlink, 0, 0, st.st_size, 0, 0, 0))

        outcome, saved = dedup.link_pair(canonical, follower, dry_run=False, stat_fn=stat_fn)

        self.assertIs(outcome, dedup.Outcome.CROSS_DEVICE)
        self.assertEqual(saved, 0)
        self.assertNotEqual(real_stat(canonical).st_ino, real_stat(follower).st_ino)
        self.assertEqual(real_stat(follower).st_nlink, 1)

    def test_in_place_edit_detected_via_inode_divergence(self):
        real_stat = os.stat
        canonical, follower = str(self.canonical), str(self.follower)
        calls = {}

        def stat_fn(path):
            calls[path] = calls.get(path, 0) + 1
            st = real_stat(path)
            if path == canonical and calls[path] == 2:
                # the canonical file was replaced between check and mutation
                return os.stat_result((st.st_mode, st.st_ino + 100, st.st_dev, st.st_nlink, 0, 0, st.st_size, 0, 0, 0))
            return st

        outcome, saved = dedup.link_pair(canonical, follower, dry_run=False, stat_fn=stat_fn)

        self.assertIs(outcome, dedup.Outcome.UNSTABLE)
        self.assertEqual(saved, 0)
        self.assertNotEqual(real_stat(canonical).st_ino, real_stat(follower).st_ino)
        self.assertEqual(real_stat(follower).st_nlink, 1)
        self.assertFalse(os.path.exists(follower + ".dedup-tmp"))

    def test_in_place_edit_detected_via_link_count_divergence(self):
        real_stat = os.stat
        canonical, follower = str(self.canonical), str(self.follower)
        calls = {}

        def stat_fn(path):
            calls[path] = calls.get(path, 0) + 1
            st = real_stat(path)
            if path == canonical and calls[path] == 3:
                # a concurrent relink shows up as an unexpected link count
                return os.stat_result((st.st_mode, st.st_ino, st.st_dev, st.st_nlink + 2, 0, 0, st.st_size, 0, 0, 0))
            return st

        outcome, saved = dedup.link_pair(canonical, follower, dry_run=False, stat_fn=stat_fn)

        self.assertIs(outcome, dedup.Outcome.UNSTABLE)
        self.assertEqual(saved, 0)
        self.assertNotEqual(real_stat(canonical).st_ino, real_stat(follower).st_ino)
        self.assertEqual(real_stat(follower).st_nlink, 1)
        self.assertFalse(os.path.exists(follower + ".dedup-tmp"))

    def test_swap_keeps_the_follower_path_present_until_the_rename(self):
        real_replace = os.replace
        seen = {}
        follower = str(self.follower)

        def replace_spy(src, dst):
            seen["follower_present_at_swap"] = os.path.exists(dst)
            seen["temp_present_at_swap"] = os.path.exists(src)
            seen["follower_inode_at_swap"] = os.stat(dst).st_ino
            return real_replace(src, dst)

        with patch.object(dedup.os, "replace", replace_spy):
            outcome, _ = dedup.link_pair(str(self.canonical), follower, dry_run=False)

        self.assertIs(outcome, dedup.Outcome.LINKED)
        self.assertTrue(seen["follower_present_at_swap"])
        self.assertTrue(seen["temp_present_at_swap"])
        self.assertNotEqual(seen["follower_inode_at_swap"], os.stat(follower).st_ino)
        self.assertEqual(os.stat(follower).st_ino, self.canonical.stat().st_ino)

    def test_link_failure_leaves_the_follower_untouched(self):
        follower = str(self.follower)
        before = os.stat(follower)

        with patch.object(dedup.os, "link", side_effect=OSError("disk full")):
            outcome, saved = dedup.link_pair(str(self.canonical), follower, dry_run=False)

        self.assertIs(outcome, dedup.Outcome.ERROR)
        self.assertEqual(saved, 0)
        after = os.stat(follower)
        self.assertEqual(before.st_ino, after.st_ino)
        self.assertEqual(after.st_nlink, 1)
        self.assertEqual(Path(follower).read_bytes(), b"same-bytes")
        self.assertFalse(os.path.exists(follower + ".dedup-tmp"))

    def test_swap_failure_leaves_the_follower_untouched_and_cleans_up(self):
        follower = str(self.follower)
        before = os.stat(follower)

        with patch.object(dedup.os, "replace", side_effect=OSError("read-only")):
            outcome, saved = dedup.link_pair(str(self.canonical), follower, dry_run=False)

        self.assertIs(outcome, dedup.Outcome.ERROR)
        self.assertEqual(saved, 0)
        after = os.stat(follower)
        self.assertEqual(before.st_ino, after.st_ino)
        self.assertEqual(Path(follower).read_bytes(), b"same-bytes")
        self.assertFalse(os.path.exists(follower + ".dedup-tmp"))

    def test_second_run_links_nothing(self):
        first, _ = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=False)
        self.assertIs(first, dedup.Outcome.LINKED)
        inode = os.stat(self.follower).st_ino

        second, saved = dedup.link_pair(str(self.canonical), str(self.follower), dry_run=False)

        self.assertIs(second, dedup.Outcome.ALREADY_LINKED)
        self.assertEqual(saved, 0)
        self.assertEqual(os.stat(self.follower).st_ino, inode)
        self.assertEqual(self.canonical.stat().st_nlink, 2)


if __name__ == "__main__":
    unittest.main()
