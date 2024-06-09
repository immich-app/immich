(bool, String, int) checkVersionCompatibility(
  int appMajor,
  int appMinor,
  int serverMajor,
  int serverMinor,
) {
  if (serverMajor != appMajor) {
    return (false, 'major', appMajor);
  }

  // Add latest compat info up top
  if (serverMinor < 106 && appMinor >= 106) {
    return (false, 'minor', 106);
  }

  return (true, '', 0);
}
