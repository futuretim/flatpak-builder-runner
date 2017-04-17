'use babel';

import FlatpakBuilderRunnerView from './flatpak-builder-runner-view';
import { CompositeDisposable } from 'atom';
import execSeries from 'exec-series';

export default {

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
      'flatpak-builder-runner:toggle': () => this.toggle(),
      'flatpak-builder-runner:run': () => this.run()
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

  run() {
    console.log('FlatpakBuilderRunner was run!');
    atom.notifications.addInfo("This worked!!!", null);
    execSeries(['flatpak-builder --force-clean --repo=/home/tim/local-flatpak-repo build_dirs/test com.sharedpointer.ghex.json']);
  }
};
