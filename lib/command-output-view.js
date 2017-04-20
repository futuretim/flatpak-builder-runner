'use babel';

import { CompositeDisposable } from 'atom';
import { $, View } from 'space-pen';

import { CommandRunner } from './command-runner';
import Utils from './run-command-utils';

export default class CommandOutputView extends View {

    static initClass() {

      this.prototype.attrs = null;
    }

    static content() {

      return this.div({class: 'command-runner'}, () =>
      {
        this.header({class: 'panel-heading'}, () =>
        {
          this.span('Command: ');
          return this.span({class: 'command-name', outlet: 'header'});
        });

        return this.div({class: 'markdown-preview', outlet: 'outputContainer'}, () =>
        {
          return this.pre(
            {
              class: 'markdown-preview',
              outlet: 'output',
              tabIndex: -1
            });
        });
      });

    }

    initialize(runner) {
      this.panel = atom.workspace.addBottomPanel({
        item: this,
        visible: false
      });

      this.subscriptions = new CompositeDisposable();
      this.subscriptions.add = runner.onCommand(command => {
        return this.setCommand(command);
      });
      this.subscriptions.add = runner.onData(data => {
        return this.addOutput(data);
      });
      this.subscriptions.add = runner.onClose(() => {
        return this.setExited();
      });
      return this.subscriptions.add = runner.onKill(signal => {
        return this.setKillSignal(signal);
      });
    }

    destroy() {
      return this.subscriptions.destroy();
    }

    show() {
      this.panel.show();
      return this.scrollToBottomOfOutput();
    }

    hide() {
      return this.panel.hide();
    }

    isVisible() {
      return this.panel.isVisible();
    }



    atBottomOfOutput() {
      return this.output[0].scrollHeight <= (this.output.scrollTop() + this.output.outerHeight());
    }

    scrollToBottomOfOutput() {
      return this.output.scrollToBottom();
    }



    setCommand(command) {
      this.clearOutput();
      this.header.text(command);
      return this.show();
    }

    clearOutput() {
      return this.output.empty();
    }



    classesForAnsiCodes(codes) {
      return (codes != null ? codes.map(function(code) {
        switch (code) {
          case 39: return 'ansi-default-fg';
          case 30: return 'ansi-black-fg';
          case 31: return 'ansi-red-fg';
          case 32: return 'ansi-green-fg';
          case 33: return 'ansi-yellow-fg';
          case 34: return 'ansi-blue-fg';
          case 35: return 'ansi-magenta-fg';
          case 36: return 'ansi-cyan-fg';
          case 37: return 'ansi-light-gray-fg';
          case 90: return 'ansi-dark-gray-fg';
          case 91: return 'ansi-light-red-fg';
          case 92: return 'ansi-light-green-fg';
          case 93: return 'ansi-light-yellow-fg';
          case 94: return 'ansi-light-blue-fg';
          case 95: return 'ansi-light-magenta-fg';
          case 96: return 'ansi-light-cyan-fg';
          case 97: return 'ansi-white-fg';

          case 49: return 'ansi-default-bg';
          case 40: return 'ansi-black-bg';
          case 41: return 'ansi-red-bg';
          case 42: return 'ansi-green-bg';
          case 43: return 'ansi-yellow-bg';
          case 44: return 'ansi-blue-bg';
          case 45: return 'ansi-magenta-bg';
          case 46: return 'ansi-cyan-bg';
          case 47: return 'ansi-light-gray-bg';
          case 100: return 'ansi-dark-gray-bg';
          case 101: return 'ansi-light-red-bg';
          case 102: return 'ansi-light-green-bg';
          case 103: return 'ansi-light-yellow-bg';
          case 104: return 'ansi-light-blue-bg';
          case 105: return 'ansi-light-magenta-bg';
          case 106: return 'ansi-light-cyan-bg';
          case 107: return 'ansi-white-bg';
        }}).filter(x => x != null) : undefined);
    }

    attrsForCodes(codes) {
      let attrs = {};
      for (let code of Array.from(codes)) {
        switch (code) {
          case 0:
            attrs.fg = 'default';
            attrs.bg = 'default';
            break;

          case 39: attrs.fg = 'default'; break;
          case 30: attrs.fg = 'black'; break;
          case 31: attrs.fg = 'red'; break;
          case 32: attrs.fg = 'green'; break;
          case 33: attrs.fg = 'yellow'; break;
          case 34: attrs.fg = 'blue'; break;
          case 35: attrs.fg = 'magenta'; break;
          case 36: attrs.fg = 'cyan'; break;
          case 37: attrs.fg = 'light-gray'; break;
          case 90: attrs.fg = 'dark-gray'; break;
          case 91: attrs.fg = 'light-red'; break;
          case 92: attrs.fg = 'light-green'; break;
          case 93: attrs.fg = 'light-yellow'; break;
          case 94: attrs.fg = 'light-blue'; break;
          case 95: attrs.fg = 'light-magenta'; break;
          case 96: attrs.fg = 'light-cyan'; break;
          case 97: attrs.fg = 'white'; break;

          case 49: attrs.bg = 'default'; break;
          case 40: attrs.bg = 'black'; break;
          case 41: attrs.bg = 'red'; break;
          case 42: attrs.bg = 'green'; break;
          case 43: attrs.bg = 'yellow'; break;
          case 44: attrs.bg = 'blue'; break;
          case 45: attrs.bg = 'magenta'; break;
          case 46: attrs.bg = 'cyan'; break;
          case 47: attrs.bg = 'light-gray'; break;
          case 100: attrs.bg = 'dark-gray'; break;
          case 101: attrs.bg = 'light-red'; break;
          case 102: attrs.bg = 'light-green'; break;
          case 103: attrs.bg = 'light-yellow'; break;
          case 104: attrs.bg = 'light-blue'; break;
          case 105: attrs.bg = 'light-magenta'; break;
          case 106: attrs.bg = 'light-cyan'; break;
          case 107: attrs.bg = 'white'; break;
        }
      }
      return attrs;
    }

    applyCodesToAttrs(codes, attrs) {
      let next = this.attrsForCodes(codes);
      return $.extend({}, attrs || {}, next);
    }

    classesForAttrs(attrs) {
      return [`ansi-fg-${(attrs != null ? attrs.fg : undefined) || 'default'}`, `ansi-bg-${(attrs != null ? attrs.bg : undefined) || 'default'}`];
    }

    createOutputNode(text) {
      let node = $('<span />').text(text);
      let parent = $('<span />').append(node);

      let colorCodeRegex = /\x1B\[([0-9;]*)m/g;
      let colorizedHtml = parent.html().replace(colorCodeRegex, (_, matches) => {
        let codes = matches != null ? matches.split(';')
                  .map(x => parseInt(x, 10))
                  .filter(x => !isNaN(x)) : undefined;

        if (codes.length === 0) {
          codes = [0];
        }

        this.attrs = this.applyCodesToAttrs(codes, this.attrs);
        let classes = this.classesForAttrs(this.attrs);

        return `</span><span class='${classes.join(' ')}'>`;
      });

      return parent.html(colorizedHtml);
    }



    addOutput(data, classes) {
      let atBottom = this.atBottomOfOutput();

      let node = this.createOutputNode(data);

      if (classes != null) {
        node.addClass(classes.join(' '));
      }

      this.output.append(node);

      if (atBottom) {
        return this.scrollToBottomOfOutput();
      }
    }

    setExited() {
      let message = 'Command exited\n';
      return this.addOutput(message, ['exit', 'exited']);
    }

    setKillSignal(signal) {
      let message = `Command killed with signal ${signal}\n`;
      return this.addOutput(message, ['exit', 'kill-signal']);
    }
}
