'use babel';

import path from 'path';

export default class Manifest {

    constructor(manifestPath) {
      this.path = manifestPath;

      this.filename = manifestPath.split('\\').pop().split('/').pop();
      this.directory = path.dirname(manifestPath);
    }

    getPath() { return this.path; }
}
