'use babel';

import fs from 'fs';
import execSeries from 'exec-series';

export default class Utils {

  static loadJSON(target) {
      fs.openSync(target.getPath(), "r+");
      var data = fs.readFileSync(target.getPath());
      var manifestJSON = JSON.parse(data);

      return manifestJSON;
  }

  static execCommand(command) {
    console.log(command);
    atom.notifications.addInfo(command);

    execSeries([command], (err, stdouts, stderrs) => {
        if (err) {
          throw err;
        }

      console.log(stdouts);
      console.log(stderrs);
    });
  }


}
