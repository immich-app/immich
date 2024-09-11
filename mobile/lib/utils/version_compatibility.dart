String? getVersionCompatibilityMessage(
  int appMajor,
  int appMinor,
  int serverMajor,
  int serverMinor,
) {
  if (serverMajor != appMajor) {
    return 'Your app major version is not compatible with the server!';
  }

  // Add latest compat info up top
  if (serverMinor < 106 && appMinor >= 106) {
    return 'Your app minor version is not compatible with the server! Please update your server to version v1.106.0 or newer to login';
  }

  return null;
}
