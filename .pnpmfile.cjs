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
      if (pkg.name && pkg.name === "sharp") {
        const optionalDeps = Object.keys(pkg.optionalDependencies).filter(
          (dep) => dep.startsWith("@img")
        );
        for (const dep of optionalDeps) {
          if (dep.includes("musl")) {
            continue;
          }
          delete pkg.optionalDependencies[dep];
        }
      }
      return pkg;
    },
  },
};
