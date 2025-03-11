## Description

<!--- Describe your changes in detail -->
<!--- Why is this change required? What problem does it solve? -->
<!--- If it fixes an open issue, please link to the issue here. -->

Fixes # (issue)

## How Has This Been Tested?

<!-- Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce. Please also list any relevant details for your test configuration -->

- [ ] Test A
- [ ] Test B

<details><summary><h2>Screenshots (if appropriate)</h2></summary>

<!-- Images go below this line. -->

</details>

<!-- API endpoint changes (if relevant)
## API Changes
The `/api/something` endpoint is now `/api/something-else`
-->

## Checklist:

- [ ] I have performed a self-review of my own code
- [ ] I have made corresponding changes to the documentation if applicable
- [ ] I have no unrelated changes in the PR.
- [ ] I have confirmed that any new dependencies are strictly necessary.
- [ ] I have written tests for new code (if applicable)
- [ ] I have followed naming conventions/patterns in the surrounding code
- [ ] All code in `src/services/` uses repositories implementations for database calls, filesystem operations, etc.
- [ ] All code in `src/repositories/` is pretty basic/simple and does not have any immich specific logic (that belongs in `src/services/`)
