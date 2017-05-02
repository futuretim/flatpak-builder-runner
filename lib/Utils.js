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

  static interpolate(theString, argumentArray) {
    var regex = /%s/;
    var _r=function(p,c){return p.replace(regex,c);}
    return argumentArray.reduce(_r, theString);
  }


  static getSchemaFromURL(request) {
      var content = "";

      var req = require('https').request(request, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(chunk) {
          content += chunk;
        });

        res.on("end", function() {
          console.log(content);
        });

      });

      req.end();

      return content;
    }

  static getSchemaFromFile(path) {
      var data = "";
      return require('fs').readFileSync(path, 'utf8');
    }
}
