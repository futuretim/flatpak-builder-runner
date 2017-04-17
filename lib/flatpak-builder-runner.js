'use babel';

import FlatpakBuilderRunnerView from './flatpak-builder-runner-view';
import { CompositeDisposable } from 'atom';
import execSeries from 'exec-series';

export default {

  config: {
    "repoPath": {
      "description": "The default repository to use when building.",
      "type": "string",
      "default": "~/local-flatpak-repo"
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
      'flatpak-builder-runner:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('.tree-view .file', {
      'flatpak-builder-runner:run': (target) => this.run(target.target)
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

  toggle() {
    console.log('FlatpakBuilderRunner was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  },

  run(target) {
    console.log('FlatpakBuilderRunner was run!');
    console.log(target.getPath());
    var filename = target.getPath().split('\\').pop().split('/').pop();
    let buildDir = atom.config.get('flatpak-builder-runner.buildDir');
    let repoPath = atom.config.get('flatpak-builder-runner.repoPath');
    let command = 'flatpak-builder --force-clean --repo=' + repoPath + ' ' + buildDir + '/' + filename + ' ' + filename;
    atom.notifications.addInfo(command);
    console.log(command);
    execSeries([command]);
  }
};
