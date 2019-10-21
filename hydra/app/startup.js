const utils = require('./core/utils.js')
const loop = require('raf-loop')

// Core
const HydraSynth = require('hydra-synth')
// was in node_modules const HydraSynth = require('./extensions/hydra-synth')
const Editor = require('./core/hydra-editor')

// Extensions
const OscManager = require('./extensions/hydra-osc')
const MidiManager = require('./extensions/hydra-midi')

window.Clock = require('./extensions/clock.js')
window.cc=Array(128).fill(0.5)

function init () {
  // init hydra
  hydra = new HydraSynth({ canvas: initCanvas(), autoLoop: false })
  editor = new Editor({ loadFromStorage: true})

  // special functions for running hydra in electron
  utils.initElectron(hydra)

  // initiate extensions, using 'window.' makes globally available
  window.msg = new OscManager()
  // MIDI use like: osc( () => midi.cc[18]  ).out()
  window.midi = new MidiManager()
 
// loop function run on each frame
  var engine = loop(function(dt) {
    hydra.tick(dt)
    if(window.update) {
      try { window.update(dt) } catch (e) {editor.log(e.message, "log-error")}
    }
    }).start()
}

function initCanvas() {
  // initiate hydra canvas
  var canvas = document.createElement('canvas')
  //  getElementById('hydra-canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.setAttribute('id', 'hydra-canvas')
  document.body.appendChild(canvas)
  return canvas
}
//
window.onload = init
