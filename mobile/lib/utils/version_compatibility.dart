String? getVersionCompatibilityMessage(int _, int appMinor, int _, int serverMinor) {
  // Add latest compat info up top
  if (serverMinor < 106 && appMinor >= 106) {
    return 'Your app minor version is not compatible with the server! Please update your server to version v1.106.0 or newer to login';
  }

  return null;
}
