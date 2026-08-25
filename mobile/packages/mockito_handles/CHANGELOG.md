# Changelog

## 0.1.0

Initial release.

- Emits one zero-cost `extension type` handle per mocked member, chained after
  `mockito`'s `mockBuilder` via `required_inputs`, so one
  `dart run build_runner build` produces mocks and handles together.
- Stubs take no argument matchers (`mockResolvedValue`, `mockRejectedValue`,
  `mockReturnValue`, `mockThrow`), and `mockImplementation` receives the member's
  real typed arguments rather than an `Invocation`.
- Verification takes real values and is type-checked, because signatures are read
  from the interface element rather than from mockito's parameter-widened
  override: `calledWith`, `calledWithMatching`, `calledOnce`, `calledTimes`,
  `captured`, `calls`, `lastCall`, and their negations under `not`.
- A facade per mocked type (`TypeMock()`, `TypeMock.of(existing)`) exposing every
  member handle plus `mock`, `reset` and `zeroInteractions`.
- Members are selected by an origin rule: the package being built is always
  owned, and `additional_owned_packages` adds more. Generic and unrenderable
  members degrade to a logged skip rather than failing the build.
