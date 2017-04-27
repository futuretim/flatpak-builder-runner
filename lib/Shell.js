'use babel';

import path from 'path';

import Manifest from "./Manifest.js"
import Utils from "./Utils.js"

export default class Shell {

  constructor(manifest) {
    console.log(manifest);
    this.manifest = manifest;

    this.flatpakBashCommand = 'flatpak-builder --run %s %s bash';
  }

  BashForApp(terminalChoice) {

    console.log(this.manifest);
    var manifest_directory = this.manifest.directory;
    let buildDir = path.join(manifest_directory, atom.config.get('flatpak-builder-runner.buildDir'), this.manifest.filename);

    if (terminalChoice == "gnome-terminal") {
      let command = 'gnome-terminal --tab -e "' + this.flatpakBashCommand + '"';

      command = Utils.interpolate(command, [
        buildDir,
        this.manifest.path
      ]);

      console.log(command);

      require('child_process').exec(command);
    }
  }

}
