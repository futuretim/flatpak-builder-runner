'use babel';

import FlatpakBuilderRunnerView from './flatpak-builder-runner-view';
import { CompositeDisposable } from 'atom';
import execSeries from 'exec-series';
import Utils from './Utils.js';

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
    }
  },

  flatpakBuilderRunnerView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.flatpakBuilderRunnerView = new FlatpakBuilderRunnerView(state.flatpakBuilderRunnerViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.flatpakBuilderRunnerView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'flatpak-builder-runner:addrepo': () => this.addrepo()
    }));

    this.subscriptions.add(atom.commands.add('.tree-view .file', {
      'flatpak-builder-runner:build': (target) => this.build(target),
      'flatpak-builder-runner:install': (target) => this.install(target),
      'flatpak-builder-runner:run': (target) => this.run(target),
      'flatpak-builder-runner:uninstall': (target) => this.uninstall(target)
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.flatpakBuilderRunnerView.destroy();
  },

  serialize() {
    return {
      flatpakBuilderRunnerViewState: this.flatpakBuilderRunnerView.serialize()
    };
  },

  build(eventTarget) {
    let target = eventTarget.currentTarget;
    console.log(target.getPath());
    var filename = target.getPath().split('\\').pop().split('/').pop();
    let buildDir = atom.config.get('flatpak-builder-runner.buildDir');
    let repoPath = atom.config.get('flatpak-builder-runner.repoPath');
    let command = 'flatpak-builder --force-clean --repo=' + process.env.HOME + '/' + repoPath + ' ' + buildDir + '/' + filename + ' ' + target.getPath();

    Utils.execCommand(command);
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

    atom.notifications.addInfo(command);

    Utils.execCommand(command);
  }
}
