
class ImmichEnvironment {
  bool testMode = false;

  // Private constructor for singleton pattern
  ImmichEnvironment._();
  static final ImmichEnvironment instance = ImmichEnvironment._();
}