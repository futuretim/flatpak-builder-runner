'use babel';

import fs from 'fs';

export default class Utils {

static loadJSON(target) {
    fs.openSync(target.getPath(), "r+");
    var data = fs.readFileSync(target.getPath());
    var manifestJSON = JSON.parse(data);

    return manifestJSON;
  }

}
