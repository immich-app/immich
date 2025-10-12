module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (!pkg.name) {
        return pkg;
      }
      if (pkg.name === "exiftool-vendored") {
        if (pkg.optionalDependencies["exiftool-vendored.pl"]) {
          // make exiftool-vendored.pl a regular dependency
          pkg.dependencies["exiftool-vendored.pl"] =
            pkg.optionalDependencies["exiftool-vendored.pl"];
          delete pkg.optionalDependencies["exiftool-vendored.pl"];
        }
      }
      return pkg;
    },
  },
};
