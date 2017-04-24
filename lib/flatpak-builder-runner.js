'use babel';

import { CompositeDisposable } from 'atom';
import execSeries from 'exec-series';
import Utils from './Utils.js';

import CommandRunner from './command-runner.coffee';
import CommandOutputView from './command-output-view.coffee';

import path from 'path';

export default {

  config: {
    "repoName": {
      "description": "The default repository name.",
      "type": "string",
      "default": "local"
    },

    "repoPath": {
      "description": "The default repository to use when building. It will be relative to the user's home directory.",
      "type": "string",
      "default": "local-flatpak-repo"
    },

    "buildDir": {
      "description": "The default build directory parent to use when building.",
      "type": "string",
      "default": "build_dirs"
    },

    "shellCommand":  {
      "description": "The shell command to use",
      "type": "string",
      "default": "/bin/bash"
    },

    "useLoginShell": {
      "Description": "Whether to use the login shell or not",
      "type": "boolean",
      "default": "true"
    }
  },

  subscriptions: null,
  runner: null,
  commandOutputView: null,

  activate(state) {

    runner = new CommandRunner();
    commandOutputView = new CommandOutputView(runner);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'flatpak-builder-runner:addrepo': () => this.addrepo(),
      'flatpak-builder-runner:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('.tree-view .file', {
      'flatpak-builder-runner:build': (target) => this.build(target),
      'flatpak-builder-runner:install': (target) => this.install(target),
      'flatpak-builder-runner:run': (target) => this.run(target),
      'flatpak-builder-runner:uninstall': (target) => this.uninstall(target),
      'flatpak-builder-runner:open_shell': (target) => this.openShell(target),
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  },

  build(eventTarget) {
    let target = eventTarget.currentTarget;
    console.log(target.getPath());
    var filename = target.getPath().split('\\').pop().split('/').pop();
    let buildDir = atom.config.get('flatpak-builder-runner.buildDir');
    let repoPath = atom.config.get('flatpak-builder-runner.repoPath');

    let pathPart = path.dirname(target.getPath())
    let command = 'cd ' + pathPart  + ' && flatpak-builder --force-clean --repo=' + process.env.HOME + '/' + repoPath + ' ' + buildDir + '/' + filename + ' ' + target.getPath();

    runner.run(command);
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
    let target = eventTarget.currentTarget;
    var filename = target.getPath().split('\\').pop().split('/').pop();
    let buildDir = atom.config.get('flatpak-builder-runner.buildDir');

    let pathPart = path.dirname(target.getPath())

    var manifestJSON = Utils.loadJSON(target);

    let command = 'gnome-terminal --tab -e "flatpak-builder --run ' + path.join(pathPart, buildDir, filename) + ' ' + target.getPath() + ' bash' + '"'

    console.log(command);
    atom.notifications.addInfo(command);

    require('child_process').exec(command);
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
