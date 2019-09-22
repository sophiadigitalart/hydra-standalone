const utils = require('./core/utils.js')
const loop = require('raf-loop')

// Core
const HydraSynth = require('hydra-synth')
// was in node_modules const HydraSynth = require('./extensions/hydra-synth')
const Editor = require('./core/hydra-editor')

// Extensions
const OscManager = require('./extensions/hydra-osc')
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
  //midi
  // register WebMIDI
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

// loop function run on each frame
  var engine = loop(function(dt) {
    hydra.tick(dt)
    if(window.update) {
      try { window.update(dt) } catch (e) {editor.log(e.message, "log-error")}
    }
    }).start()
}
// midi
function onMIDISuccess(midiAccess) {
  console.log(midiAccess);
  var inputs = midiAccess.inputs;
  var outputs = midiAccess.outputs;
  for (var input of midiAccess.inputs.values()){
      input.onmidimessage = getMIDIMessage;
  }
}

function onMIDIFailure() {
console.log('Could not access your MIDI devices.');
}
   
getMIDIMessage = function(midiMessage) {
  var arr = midiMessage.data    
  var index = arr[1]
  console.log('Midi received on cc#' + index + ' value:' + arr[2])    // uncomment to monitor incoming Midi
  var val = (arr[2]+1)/128.0  // normalize CC values to 0.0 - 1.0
  window.cc[index]=val
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
