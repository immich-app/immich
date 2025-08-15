module.exports = {
  hooks: {
    readPackage: (pkg) => {
      if (!pkg.name) {
        return pkg;
      }
      switch (pkg.name) {
        case "exiftool-vendored":
          if (pkg.optionalDependencies["exiftool-vendored.pl"]) {
            // make exiftool-vendored.pl a regular dependency
            pkg.dependencies["exiftool-vendored.pl"] =
              pkg.optionalDependencies["exiftool-vendored.pl"];
            delete pkg.optionalDependencies["exiftool-vendored.pl"];
          }
          break;
        case "sharp":
          const optionalDeps = Object.keys(pkg.optionalDependencies).filter(
            (dep) => dep.startsWith("@img")
          );
          for (const dep of optionalDeps) {
            // remove all optionalDepdencies from sharp (they will be compiled from source), except:
            //   include the precompiled musl version of sharp, for web/Dockerfile
            //   include precompiled linux-x64 version of sharp, for server/Dockerfile, stage: web-prod
            //   include precompiled linux-arm64 version of sharp, for server/Dockerfile, stage: web-prod
            if (
              dep.includes("musl") ||
              dep.includes("linux-x64") ||
              dep.includes("linux-arm64")
            ) {
              continue;
            }
            delete pkg.optionalDependencies[dep];
          }
          break;
      }
      return pkg;
    },
  },
};
