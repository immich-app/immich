import 'wizard_step.dart';

class WizardState {
  final WizardStep step;
  final String serverUrl;
  final bool isLoading;
  final bool isServerValidated;
  final String? errorMessage;

  const WizardState({
    this.step = WizardStep.serverUrl,
    this.serverUrl = '',
    this.isLoading = false,
    this.isServerValidated = false,
    this.errorMessage,
  });

  // Manual copyWith since Freezed isn't working
  WizardState copyWith({
    WizardStep? step,
    String? serverUrl,
    bool? isLoading,
    bool? isServerValidated,
    String? errorMessage,
  }) {
    return WizardState(
      step: step ?? this.step,
      serverUrl: serverUrl ?? this.serverUrl,
      isLoading: isLoading ?? this.isLoading,
      isServerValidated: isServerValidated ?? this.isServerValidated,
      errorMessage: errorMessage, // We allow passing null to clear errors
    );
  }
}
