module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (pkg.name && pkg.name === "exiftool-vendored") {
        if (pkg.optionalDependencies["exiftool-vendored.pl"]) {
          pkg.dependencies["exiftool-vendored.pl"] =
            pkg.optionalDependencies["exiftool-vendored.pl"];
          delete pkg.optionalDependencies["exiftool-vendored.pl"];
        }
      }
      return pkg;
    },
  },
};
