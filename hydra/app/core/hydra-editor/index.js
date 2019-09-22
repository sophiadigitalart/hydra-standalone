/* eslint-disable no-eval */
var CodeMirror = require('codemirror/lib/codemirror')
require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/javascript-hint')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/selection/mark-selection')

const storage = require('electron-json-storage')

var isShowing = true
var Editor = function ({
  loadFromStorage = true
} = {}) {
  var self = this
  var container = document.createElement('div')
  container.setAttribute('id','editor-container')
  var el = document.createElement('TEXTAREA')
  document.body.appendChild(container)
  container.appendChild(el)

  this.cm = CodeMirror.fromTextArea(el, {
    theme: 'tomorrow-night-eighties',
    value: 'hello',
    mode: {name: 'javascript', globalVars: true},
    lineWrapping: true,
    styleSelectedText: true,
    extraKeys: {
      'Shift-Ctrl-Enter': function (instance) {
          self.evalAll((code, error) => {
            console.log('evaluated', code, error)
            // if(!error){
            //   self.saveSketch(code)
            // }
          })
      },
      'Shift-Ctrl-G': function (instance) {
        self.shareSketch()
      },
      'Shift-Ctrl-H': function (instance) {
        var l = document.getElementsByClassName('CodeMirror-scroll')[0]
      //  var m = document.getElementById('modal-header')
        if (isShowing) {
          l.style.opacity = 0
          self.logElement.style.opacity  = 0
        //  m.style.opacity = 0
          isShowing = false
        } else {
          l.style.opacity= 1
      //    m.style.opacity = 1
          self.logElement.style.opacity  = 1
          isShowing = true
        }
      },
      'Ctrl-Enter': function (instance) {
        var c = instance.getCursor()
        var s = instance.getLine(c.line)
        self.eval(s)
      },
      'Ctrl-Space': function (instance) {
        var text = self.autoComplete(instance)
        console.log('autocomp', text)
      },
      /* 'Ctrl-M': function (instance) {
        self.midi(instance)
        console.log('midi')
      }, */
      'Shift-Ctrl-S': function (instance) {
        screencap()
      },
      'Alt-Enter': (instance) => {
        var text = self.selectCurrentBlock(instance)
        console.log('text', text)
        self.eval(text.text)
      }
    }
  })

  this.cm.markText({line: 0, ch: 0}, {line: 6, ch: 42}, {className: 'hydra-flash'})
  this.cm.refresh()
  this.logElement = document.createElement('div')
  this.logElement.className = "console cm-s-tomorrow-night-eighties"
  document.body.appendChild(this.logElement)


  if(loadFromStorage) {
    storage.get('code', function(error, data) {
      if(data && typeof data === 'string') {
        self.cm.setValue(data)
        self.evalAll()
      } else {
        self.cm.setValue('osc().out()')
        self.evalAll()
      }
      if (error) throw error;
    });

    window.onbeforeunload = function (e) {
      e.preventDefault()
      storage.set('code', self.cm.getValue(), function(error) {
        if (error) throw error;
      })
    }
  } else {
    self.cm.setValue('osc().out()')
    self.evalAll()
  }
}

Editor.prototype.clear = function () {
  this.cm.setValue('\n \n // Type some code on a new line (such as "osc().out()"), and press CTRL+shift+enter')
}

Editor.prototype.saveSketch = function(code) {
  console.log('no function for save sketch has been implemented')
}

Editor.prototype.shareSketch = function(code) {
  console.log('no function for share sketch has been implemented')
}

// Editor.prototype.saveExample = function(code) {
//   console.log('no function for save example has been implemented')
// }

Editor.prototype.evalAll = function (callback) {
  this.eval(this.cm.getValue(), function (code, error){
    if(callback) callback(code, error)
  })
}

Editor.prototype.eval = function (arg, callback) {
  var self = this
  var jsString = arg
  var isError = false

  if (!isError){
    try {
      eval(jsString)
      //self.log(jsString)
      self.log("Ok")
    } catch (e) {
      isError = true
      self.log(e.message, "log-error")
    }
  }
  if(callback) callback(jsString, isError)
}

Editor.prototype.log = function(msg, className = "") {
  this.logElement.innerHTML =` >> <span class=${className}> ${msg} </span> `
}

Editor.prototype.selectCurrentBlock = function (editor) { // thanks to graham wakefield + gibber
  var pos = editor.getCursor()
  var startline = pos.line
  var endline = pos.line
  while (startline > 0 && editor.getLine(startline) !== '') {
    startline--
  }
  while (endline < editor.lineCount() && editor.getLine(endline) !== '') {
    endline++
  }
  var pos1 = {
    line: startline,
    ch: 0
  }
  var pos2 = {
    line: endline,
    ch: 0
  }
  var str = editor.getRange(pos1, pos2)
  return {
    start: pos1,
    end: pos2,
    text: str
  }
}

Editor.prototype.autoComplete = function (editor) { 
  var pos = editor.getCursor()
  var startline = pos.line
  var pos1 = {
    line: pos.line,
    ch: pos.ch - 1
  }
  var pos2 = {
    line: pos.line,
    ch: pos.ch
  }
  var str = editor.getRange(pos1, pos2)
  switch (str) {
    case '2':
      editor.replaceRange('vec2 vv = vec2(0.0, 0.0);', pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 6;
      editor.setSelection(pos1, pos2)
      break;
    case '3':
      editor.replaceRange('vec3 vvv = vec3(0.0, 0.0, 0.0);', pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case '4':
      editor.replaceRange('vec4 vvvv = vec4(0.0, 0.0, 0.0, 0.0);', pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 8;
      editor.setSelection(pos1, pos2)
      break;
    case '1':
      editor.replaceRange('float f = 0.0;', pos1, pos2)
      pos1.ch += 6;
      pos2.ch += 6;
      editor.setSelection(pos1, pos2)
      break;
    case '{':
      editor.replaceRange(`{;}`, pos1, pos2)
      break;
    case '(':
      editor.replaceRange(`()`, pos1, pos2)
      break;
    // functions
    case 'f':
      editor.replaceRange(`float fcf(in vec3 pos) {float f = 0.0;return f;}`, pos1, pos2)
      pos1.ch += 6;
      pos2.ch += 8;
      editor.setSelection(pos1, pos2)
      break;
    case 'g':
      editor.replaceRange(`vec2 fc2(in vec3 pos) {vec2 vv = vec2(0.0, 0.0);return vv;}`, pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case 'h':
      editor.replaceRange(`vec3 fc3(in vec3 pos) {vec3 vvv = vec3(0.0, 0.0, 0.0);return vvv;}`, pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case 'j':
      editor.replaceRange(`vec4 fc4(in vec3 pos) {vec4 vvvv = vec4(0.0, 0.0, 0.0, 0.0);return vvvv;}`, pos1, pos2)
      pos1.ch += 5;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
      // objects
    case 'c':
      break;
    case 'v':
      break;
    case 'b':
      break;
    case 'n':
      break;
    // main
    case 'm':
      editor.replaceRange(`void main () {vec2 st = (2.0*gl_FragCoord.xy-resolution.xy)/resolution.xy; gl_FragColor = vec4(st.x,st.y,0.0,1.0);}`, pos1, pos2)
      pos1.ch += 74;
      pos2.ch += 74;
      editor.setSelection(pos1, pos2)
      break;
    // for
    case 'r':
      editor.replaceRange('for (int i=0; i<2 ;i++) { }', pos1, pos2)
      pos1.ch += 25;
      pos2.ch += 25;
      editor.setSelection(pos1, pos2)
      break;
    case 's':
      editor.replaceRange('sin(time)', pos1, pos2)
      pos1.ch += 4;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    case 'c':
      editor.replaceRange('cos(time)', pos1, pos2)
      pos1.ch += 4;
      pos2.ch += 7;
      editor.setSelection(pos1, pos2)
      break;
    // if   
    case '=':
      editor.replaceRange('if (i==0.0) { } else { }', pos1, pos2)
      pos1.ch += 13;
      pos2.ch += 13;
      editor.setSelection(pos1, pos2)
      break;
    case '>':
      editor.replaceRange('if (i>0.0) { } else { }', pos1, pos2)
      pos1.ch += 12;
      pos2.ch += 12;
      editor.setSelection(pos1, pos2)
      break;
    case '<':
      editor.replaceRange('if (i<0.0) { } else { }', pos1, pos2)
      pos1.ch += 12;
      pos2.ch += 12;
      editor.setSelection(pos1, pos2)
      break;
      /*case 't':
          editor.replaceRange('vec4 t0 = texture2D(tex0, st);', pos1, pos2)
          pos1.ch += 10;
          pos2.ch += 10;
          editor.setSelection(pos1, pos2)
          break; */
    
    case '#':
      editor.replaceRange(`#if V==1
      #else
      #endif`, pos1, pos2)
      pos1.ch += 4;
      pos2.ch += 4;
      editor.setSelection(pos1, pos2)
      break;

    default:
      break;
  }
  return {
    start: pos1,
    end: pos2,
    text: str
  }
}

module.exports = Editor
