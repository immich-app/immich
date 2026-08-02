from fuji_renderer.engine import EXPECTED_PROFILE_SHA256, PROFILE_SPECS


def test_profile_slug_set_is_exact() -> None:
    assert set(PROFILE_SPECS) == {
        "acros",
        "acros-g-filter",
        "acros-r-filter",
        "acros-ye-filter",
        "astia-soft",
        "bleach-bypass",
        "classic-chrome",
        "classic-neg",
        "eterna-cinema",
        "monochrome",
        "monochrome-g-filter",
        "monochrome-r-filter",
        "monochrome-ye-filter",
        "nostalgic-neg",
        "pro-neg-hi",
        "pro-neg-std",
        "provia-standard",
        "reala-ace-v2",
        "sepia",
        "velvia-vivid",
    }


def test_enhanced_profiles_use_provia_base() -> None:
    for slug in ("bleach-bypass", "classic-neg", "nostalgic-neg", "sepia"):
        assert PROFILE_SPECS[slug].dcp == "dcp/provia-standard.dcp"
        assert PROFILE_SPECS[slug].rgb_table == f"rgb-tables/{slug}.rgbtable"


def test_every_runtime_profile_file_has_a_pinned_hash() -> None:
    required = {"dcp/adobe-standard.dcp"}
    for profile in PROFILE_SPECS.values():
        required.add(profile.dcp)
        if profile.rgb_table:
            required.add(profile.rgb_table)
    assert set(EXPECTED_PROFILE_SHA256) == required
    assert all(len(digest) == 64 for digest in EXPECTED_PROFILE_SHA256.values())
