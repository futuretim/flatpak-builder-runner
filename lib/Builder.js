'use babel';

import Manifest from "./Manifest.js"
import Utils from "./Utils.js"

export default class Builder {

  constructor(manifest) {
    this.manifest = manifest;
    this.buildCommand = 'cd %s && flatpak-builder --force-clean --repo=%s/%s %s/%s %s';
  }



  build(buildDir, repoPath, runner) {

    var command = Utils.interpolate(this.buildCommand, [
      this.manifest.directory,
      process.env.HOME,
      repoPath,
      buildDir,
      this.manifest.filename,
      this.manifest.path
    ]);

    console.log(command);

    runner.run(command);
  }

}
