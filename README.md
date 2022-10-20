# UnetTrace Plugin README

VScode plugin to visualise messages being sent to and from different agents and layers in UnetStack.

## Features

User will be able to select a trace.json file. The events in the trace file will be displayed in a graph/diagram that is interactive and displays relevant information about each message transfer (e.g. sending agent, receiving agent, messageID, etc).

## Requirements

Please refer to https://code.visualstudio.com/api on how to setup the work environment for building VSC extensions.

Briefly put, the following are required:
- node.js
- Git
- VS Code Extension Generator (yo code)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

This extension contributes the following settings:

* `unettrace.trace`: Allows user to choose a trace.json file that is used for visualisation of message transfers.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
