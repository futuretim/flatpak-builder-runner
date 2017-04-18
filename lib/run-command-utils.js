'use babel';

let Utils;
export default
(Utils = class Utils {
  static stringIsBlank(str) {
    return !str || /^\s*$/.test(str);
  }
});
