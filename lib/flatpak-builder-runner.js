'use babel';

import { CompositeDisposable } from 'atom';
import execSeries from 'exec-series';
import CommandRunner from './command-runner.coffee';
import CommandOutputView from './command-output-view.coffee';
import path from 'path';
const loophole = require('loophole');

import Stubber from './Stubber.js'
import Utils from './Utils.js';
import Builder from './Builder.js';
import Manifest from './Manifest.js';
import Shell from './Shell.js';

// TODO LIST:
//
// - add handles to output view for resizing, closing, etc. (see jslint output view)

export default {

  config: {
    repoName: {
      description: "The default repository name.",
      type: "string",
      default: "local"
    },

    repoPath: {
      description: "The default repository to use when building. It will be relative to the user's home directory.",
      type: "string",
      default: "local-flatpak-repo"
    },

    buildDir: {
      description: "The default build directory parent to use when building.",
      type: "string",
      default: "build_dirs"
    },

    shellCommand:  {
      description: "The shell command to use",
      type: "string",
      default: "/bin/bash"
    },

    useLoginShell: {
      description: "Whether to use the login shell or not",
      type: "boolean",
      default: "true"
    },

    prettyJSON: {
      description: "make JSON pretty when inserting stubs",
      type: "boolean",
      default: "false"
    },

    terminal: {
      type: "string",
      default: "gnome-terminal",
      enum: [
        {value: "gnome-terminal", description: "gnome-terminal"}
      ]
    },

    schemaLocation: {
      type: "string",
      default: "/home",
      Description: "the location of the json schema to use for validating."
    }
  },

  subscriptions: null,
  runner: null,
  commandOutputView: null,

  activate(state) {

    // replace the example argument 'linter-ruby' with the name of this Atom package
    require('atom-package-deps').install('flatpak-builder-runner')
      .then(function() {
        console.log('All dependencies installed, good to go')
    })

    runner = new CommandRunner();
    commandOutputView = new CommandOutputView(runner);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'flatpak-builder-runner:addrepo': () => this.addrepo(),
      'flatpak-builder-runner:toggle': () => this.toggle(),
      'flatpak-builder-runner:add_module_stub': () => this.add_module_stub(),
      'flatpak-builder-runner:add_manifest_stub': () => this.add_manifest_stub()
    }));

    this.subscriptions.add(atom.commands.add('.tree-view .file', {
      'flatpak-builder-runner:build': (target) => this.build(target),
      'flatpak-builder-runner:install': (target) => this.install(target),
      'flatpak-builder-runner:run': (target) => this.run(target),
      'flatpak-builder-runner:uninstall': (target) => this.uninstall(target),
      'flatpak-builder-runner:open_shell': (target) => this.openShell(target),
      'flatpak-builder-runner:validate': (target) => this.validate(target)
    }));

    atom.workspace.observeActivePaneItem((editor) => {
      this.currentEditor = editor;
    })

    var home =  process.env.HOME;
    atom.config.set('flatpak-builder-runner.schemaLocation', + path.join(home, "flatpak-manifest.schema"));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  },

  add_module_stub() {
    let pretty = atom.config.get('flatpak-builder-runner.prettyJSON');
    Stubber.insertModuleStub(this.currentEditor, pretty);
  },

  add_manifest_stub() {
    let pretty = atom.config.get('flatpak-builder-runner.prettyJSON');
    Stubber.insertManifestStub(this.currentEditor, pretty);
  },

  build(eventTarget) {

    var manifest = new Manifest(eventTarget.currentTarget.getPath());
    var builder = new Builder(manifest);

    let buildDir = atom.config.get('flatpak-builder-runner.buildDir');
    let repoPath = atom.config.get('flatpak-builder-runner.repoPath');

    builder.build(buildDir, repoPath, runner);

  },

  install(eventTarget) {
    let target = eventTarget.currentTarget;
    let repoName = atom.config.get('flatpak-builder-runner.repoName');
    var filename = target.getPath().split('\\').pop().split('/').pop();

    var manifestJSON = Utils.loadJSON(target);

    let command = 'flatpak --user install ' + repoName + ' ' + manifestJSON["app-id"];
    Utils.execCommand(command);
  },

  run(eventTarget) {
    let target = eventTarget.currentTarget;
    let repoName = atom.config.get('flatpak-builder-runner.repoName');
    var filename = target.getPath().split('\\').pop().split('/').pop();

    var manifestJSON = Utils.loadJSON(target);
    let command = 'flatpak run ' + manifestJSON["app-id"];
    execSeries([command]);
    console.log(command);
    atom.notifications.addInfo(command);
  },

  uninstall(eventTarget) {
    let target = eventTarget.currentTarget;
    let repoName = atom.config.get('flatpak-builder-runner.repoName');
    var filename = target.getPath().split('\\').pop().split('/').pop();

    var manifestJSON = Utils.loadJSON(target)
    let command = 'flatpak --user uninstall ' + manifestJSON["app-id"];

    Utils.execCommand(command);
  },

  addrepo() {
    let repoPath = atom.config.get('flatpak-builder-runner.repoPath');
    let repoName = atom.config.get('flatpak-builder-runner.repoName');

    let command = "flatpak --user remote-add --no-gpg-verify " + repoName + " " + process.env.HOME + "/" + repoPath;

    runner.run(command);
  },

  openShell(eventTarget) {

    var manifest = new Manifest(eventTarget.currentTarget.getPath());
    var shell = new Shell(manifest);

    console.log(manifest);

    var terminalType = atom.config.get('flatpak-builder-runner.terminal');
    var terminalPath = path.join("/", "usr", "bin", terminalType);
    console.log(terminalPath);

    if (require('fs').existsSync(terminalPath)) {
      shell.BashForApp(atom.config.get('flatpak-builder-runner.terminal'));
    } else {
      atom.notifications.addError("Could not find terminal type, cannot open builder shell.");
    }
  },

  validate(eventTarget) {
    console.log(eventTarget.currentTarget);
    var path = eventTarget.currentTarget.getPath();

    var content = Utils.getSchemaFromFile(atom.config.get('flatpak-builder-runner.schemaLocation'));
    var validator = require('is-my-json-valid');

    var makeValidator = function (schema) {
        var loophole = require("loophole");
        if (schema == "" || schema == null)
            return null;
        return loophole.allowUnsafeNewFunction(function() {
          return validator(schema);
        });
    };

    var validate = makeValidator(JSON.parse(content));

    require('fs').readFile(path, 'utf8', function(err, data) {

      if(err) {
        console.log("there was some error loading: " + path);
      }

      if (validate(JSON.parse(data))) {
        atom.notifications.addSuccess("Manifest is valid!");
      } else {
        atom.notifications.addError("Manifest is invalid! Check console for errors.");
        atom.notifications.addError(validate.errors[0].field + " " + validate.errors[0].message);
      }

    });
  },

  toggle() {

    if (commandOutputView.isVisible()) {
      commandOutputView.hide();
    }
    else {
      commandOutputView.show();
    }
  }
}
