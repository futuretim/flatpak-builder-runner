'use babel';

import { BufferedProcess, Emitter, CompositeDisposable } from 'atom';
import path from 'path';
//import pty from 'pty.js';
//import pty from 'node-pty';
import execSeries from 'exec-series';

export default class CommandRunner {

  constructor() {
    this.running = false;
    this.subscriptions = new CompositeDisposable();
    this.emitter = new Emitter();
  }

  spawnProcess(command) {
    this.modified_spawnProcess(command);
    // original_spawnProcess(command);
  }

  original_spawnProcess(command) {
    this.running = true;

    let shell = atom.config.get('run-command.shellCommand') || '/bin/bash';
    let useLogin = atom.config.get('run-command.useLoginShell');

    let args = ['-c', command];
    if (useLogin) {
      args = ['-l'].concat(args);
    }

    this.term = pty.spawn(shell, ['-c', command], {
      name: 'xterm-color',
      cwd: this.constructor.workingDirectory(),
      env: process.env
    }
    );

    this.term.on('data', data => {
      return this.emitter.emit('data', data);
    });
    this.term.on('exit', () => {
      this.running = false;
      return this.emitter.emit('exit');
    });
    return this.term.on('close', () => {
      this.running = false;
      return this.emitter.emit('close');
    });
  }

  modified_spawnProcess(command) {
    this.running = true;

    let shell = atom.config.get('run-command.shellCommand') || '/bin/bash';
    let useLogin = atom.config.get('run-command.useLoginShell');

    let args = ['-c', command];
    if (useLogin) {
      args = ['-l'].concat(args);
    }

    execSeries([command], (err, stdouts, stderrs) => {

      this.emitter.emit('data', stdouts);
      this.emitter.emit('data', stderrs);
      this.emitter.emit('close');
    })
  }

  static homeDirectory() {
    return process.env['HOME'] || process.env['USERPROFILE'] || '/';
  }

  static workingDirectory() {
    let editor = atom.workspace.getActiveTextEditor();
    let activePath = editor != null ? editor.getPath() : undefined;
    let relative = atom.project.relativizePath(activePath);
    if (activePath != null) {
      return relative[0] || path.dirname(activePath);
    } else {
      return __guard__(atom.project.getPaths(), x => x[0]) || this.homeDirectory();
    }
  }

  onCommand(handler) {
    return this.emitter.on('command', handler);
  }
  onData(handler) {
    return this.emitter.on('data', handler);
  }
  onExit(handler) {
    return this.emitter.on('exit', handler);
  }
  onKill(handler) {
    return this.emitter.on('kill', handler);
  }
  onClose(handler) {
    return this.emitter.on('close', handler);
  }

  run(command) {
    return new Promise((function(resolve, reject) {
      this.kill();
      this.emitter.emit('command', command);

      let result = {
        output: '',
        exited: false,
        signal: null
      };

      this.spawnProcess(command);

      this.subscriptions.add(this.onData(data => {
        return result.output += data;
      })
      );
      this.subscriptions.add(this.onClose(() => {
        result.exited = true;
        return resolve(result);
      })
      );
      return this.subscriptions.add(this.onKill(signal => {
        result.signal = signal;
        return resolve(result);
      })
      );
    }.bind(this)));
  }

  kill(signal) {
    if (!signal) { signal = 'SIGTERM'; }

    if ((this.term != null) && this.running) {
      this.emitter.emit('kill', signal);
      process.kill(this.term.pid, signal);
      this.term.destroy();
      this.term = null;

      this.subscriptions.dispose();
      return this.subscriptions.clear();
    }
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
