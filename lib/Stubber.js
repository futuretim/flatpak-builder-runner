'use babel';


export default class Stubber {

  static insertStub(stub, editor, pretty) {

    let currentPosition = editor.getCursorBufferPosition();
    editor.getCursorBufferPosition();
    editor.insertText(stub);
    editor.setCursorBufferPosition(currentPosition);

    if (pretty)
    {
      var package = atom.packages.enablePackage("pretty-json");
      console.log(package);
      package.mainModule.prettify(editor);
    }
  }

  static insertModuleStub(editor, pretty) {
    var module_stub = `
            {
              "name": "",
              "sources": [
                {

                }
              ]
            },
    `;

    Stubber.insertStub(module_stub, editor, pretty);
  }

  static insertManifestStub(editor, pretty) {
    var manifestStub = `
{
  "app-id": "com.example.appid",
  "version": "",
  "runtime": "org.freedesktop.Platform",
  "runtime-version": "1.6",
  "sdk": "org.freedesktop.Sdk",
  "command": "app-command",
  "finish-args": [
    "--share=ipc",
    "--socket=x11",
    "--filesystem=host",
    "--device=dri"
  ],
  "build-options": {
    "cflags": "-O2 -g",
    "cxxflags": "-O2 -g",
    "env": {
      "V": "1"
    },
    "build-args": [
    ]
  },
  "cleanup": [
    "/include",
    "/lib/*/include",
    "/lib/pkgconfig",
    "/share/pkgconfig",
    "/share/aclocal",
    "/man",
    "/share/man",
    "/share/info",
    "/share/gtk-doc",
    "*.la",
    "*.a"
  ],
  "modules": [
    {
      "name": "app-name",
      "sources": [
        {
          "type": "git",
          "url": "https://github.com/user/project/project.git",
          "branch": "master"
        }
      ]
    }
  ]
}
    `;

    Stubber.insertStub(manifestStub, editor, pretty);
  }

}
