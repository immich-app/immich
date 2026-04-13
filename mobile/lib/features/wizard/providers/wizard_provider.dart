import 'package:flutter/material.dart'; // Added for debugPrint
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../models/wizard_state.dart';
import '../models/wizard_step.dart';

// Temporarily using a standard StateNotifier instead of the @riverpod annotation
// until your environment can run build_runner successfully.
final wizardLogicProvider = StateNotifierProvider<WizardLogic, WizardState>((ref) {
  return WizardLogic();
});

class WizardLogic extends StateNotifier<WizardState> {
  WizardLogic() : super(const WizardState());

  void setServerUrl(String url) {
    state = state.copyWith(serverUrl: url.trim(), errorMessage: null);
  }

  void moveToStep(WizardStep step) {
    state = state.copyWith(step: step);
  }

  Future<void> validateServer() async {
    if (state.serverUrl.isEmpty) {
      state = state.copyWith(errorMessage: "Please enter a server URL");
      return;
    }

    if (!state.serverUrl.startsWith('http')) {
      state = state.copyWith(errorMessage: "URL must start with http:// or https://");
      return;
    }

    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      await Future.delayed(const Duration(seconds: 1));
      
      state = state.copyWith(
        isLoading: false,
        isServerValidated: true,
        step: WizardStep.login,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: "Could not connect to Hearth Hub. Verify the URL and try again.",
      );
    }
  }

  // MOVED INSIDE THE CLASS
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      // Mocking the auth handshake
      await Future.delayed(const Duration(seconds: 2));
      
      state = state.copyWith(isLoading: false);
      
      // Navigate to the main App shell here later
      debugPrint("Login successful for $email"); 
    } catch (e) {
      state = state.copyWith(
        isLoading: false, 
        errorMessage: "Invalid credentials. Please try again."
      );
    }
  }

  void reset() {
    state = const WizardState();
  }
} // Class closing brace MUST be here