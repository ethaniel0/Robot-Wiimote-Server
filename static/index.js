import { DataReportMode, IRDataType, IRSensitivity } from "./const.js";
import WIIMote from "./wiimote.js"

var socket = io();
socket.on('connect', function() {
  console.log('connected!');
});



let requestButton = document.getElementById("request-hid-device");

var wiimote = undefined;
var udspeedPressed = false;
var udspeed = 0.25;
var lrspeedPressed = false;
var lrspeed = 1;
var prevCommand = [0, 0, 0, 0];
var rumbleCount = 0;
var rumbleSpeed = 0;

socket.on('getSense', function(num) {
  let word = ["Nothing", "Aluminum", "Steel"][num];
  document.getElementById("sense").innerHTML = word;

  // aluminum
  if(num == 1){
    rumbleSpeed = 30;
  }
  // steel
  else if (num == 2 && !wiimote.rumblingStatus){
    rumbleSpeed = 60;
  }
  //nothing
  else {
    rumbleSpeed = 0;
  }
})

function setButton(elementId, action) {
  document.getElementById(elementId).addEventListener("click", async () => {
    action()
  })  
}

requestButton.addEventListener("click", async () => {
  let device;
  try {
    const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x057e }],
    });
    
    device = devices[0];
    wiimote = new WIIMote(device)
    window.wiimote = wiimote;

  } catch (error) {
    console.log("An error occurred.", error);
  }

  if (!device) {
    console.log("No device was selected.");
  } else {
    console.log(`HID: ${device.productName}`);

    enableControls()
    initCanvas()

  }
});

/**
 * Toggle rumble: wiimote.toggleRumble()
 * Toggle LED: wiimote.toggleLed(0)
 */

function initCanvas(){
  wiimote.BtnListener = (buttons) => {
    // var buttonJSON = JSON.stringify(buttons, null, 2);

    // if(document.getElementById('buttons').innerHTML != buttonJSON){
    //   document.getElementById('buttons').innerHTML = buttonJSON
    // }
  }

  wiimote.AccListener = (x,y,z) => {
    // document.getElementById('accX').innerHTML = x
    // document.getElementById('accY').innerHTML = y
    // document.getElementById('accZ').innerHTML = z
  }

  wiimote.StickListener = (x,y) => {
    // x = (x-128)/128;
    // y = (y-128)/128;
    // document.getElementById('stickX').innerHTML = x
    // document.getElementById('stickY').innerHTML = y
  }

  wiimote.NunBtnListener = (c, z) => {
    // c = 1-c;
    // z = 1-z;
    // document.getElementById('nunC').innerHTML = c
    // document.getElementById('nunZ').innerHTML = z
  }

  wiimote.RobotListener = (a, b, two, x, y, c, z, up, down, plus, minus, acc) => {
    acc -= 125;
    if (!udspeedPressed){
      if (up){
        udspeed = Math.min(1, udspeed + 0.25);
        udspeedPressed = true;
      }
      else if (down){
        udspeed = Math.max(0.2, udspeed - 0.25);
        udspeedPressed = true;
      }
    }
    if (!up && !down) udspeedPressed = false;

    if (!lrspeedPressed){
      if (c == 0){
        lrspeed = Math.min(1, lrspeed + 0.25);
        lrspeedPressed = true;
      }
      else if (z == 0){
        lrspeed = Math.max(0.2, lrspeed - 0.25);
        lrspeedPressed = true;
      }
    }
    if (c == 1 && z == 1) lrspeedPressed = false;

    x = (x-128)/128;
    y = (y-128)/128;

    let udmotors = a ? udspeed : b ? -udspeed : 0;

    if (plus){
      udmotors = -Math.max(-1, Math.min(1, acc / 25.0));
    }
    

    let motorSend = [-(y - x)*lrspeed, -(y + x)*lrspeed, udmotors, udmotors];
    if (two) motorSend = [0, 0, 0, 0];
    
    if (motorSend[0] != prevCommand[0] || motorSend[1] != prevCommand[1] || motorSend[2] != prevCommand[2] || motorSend[3] != prevCommand[3]){
      socket.emit('thrust', motorSend);
      prevCommand = motorSend;
    }

    let normud = Math.round(udspeed*4) - 1;
    let normlr = Math.round(lrspeed*4) - 1;

    if (!plus){
      wiimote.toggleLed(0, normud % 2 == 1);
      wiimote.toggleLed(1, (normud >> 1)%2 == 1);
    }
    else {
      let ud = Math.round(Math.abs(udmotors) * 4);
      wiimote.toggleLed(0, ud % 2 == 1);
      wiimote.toggleLed(1, (ud >> 1)%2 == 1);
    }
    wiimote.toggleLed(2, normlr % 2 == 1);
    wiimote.toggleLed(3, (normlr >> 1)%2 == 1);

    if (rumbleCount < rumbleSpeed && !wiimote.rumblingStatus){
      wiimote.setRumble(true);
    }
    else wiimote.setRumble(false);
    rumbleCount = (rumbleCount+1)%60;

    document.getElementById('ctrl-x').innerHTML = Math.round(x * lrspeed * 100) + "%";
    document.getElementById('ctrl-y').innerHTML = Math.round(y * lrspeed * 100) + "%";
    document.getElementById('ud-speed').innerHTML = Math.round(udspeed * 4);
    document.getElementById('ctrl-up').style.fontWeight = a == true ? 'bold' : 'normal';
    document.getElementById('ctrl-down').style.fontWeight = b == true ? 'bold' : 'normal';
    document.getElementById('lr-speed').innerHTML = Math.round(lrspeed * 4);
    document.getElementById('ctrl-acc').innerHTML = acc;
    document.getElementById('acc-rep').style.fontWeight = plus == true ? 'bold' : 'normal';
  }

}

function enableControls(){
  document.getElementById("Controls").classList.remove("hidden")
  document.getElementById("instructions").classList.add("hidden")
}


setInterval(() => socket.emit('getSense'), 1000);

// initButtons()