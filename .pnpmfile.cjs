module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (!pkg.name) {
        return pkg;
      }
      // make exiftool-vendored.pl a regular dependency since Docker prod
      // images build with --no-optional to reduce image size
      if (pkg.name === "exiftool-vendored") {
        const binaryPackage =
          process.platform === "win32"
            ? "exiftool-vendored.exe"
            : "exiftool-vendored.pl";

        if (pkg.optionalDependencies[binaryPackage]) {
          pkg.dependencies[binaryPackage] =
            pkg.optionalDependencies[binaryPackage];
          delete pkg.optionalDependencies[binaryPackage];
        }
      }
      return pkg;
    },
  },
};
