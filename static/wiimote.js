import {
    toBigEndian,
    numbersToBuffer,
    debug,
    getBitInByte
} from "./helpers.js"

import {
    ReportMode,
    DataReportMode,
    Rumble,
    LEDS,
    BUTTON_BYTE1,
    BUTTON_BYTE2,
    RegisterType,
    IRDataType,
    IRSensitivity,
    InputReport
} from "./const.js"

export default class WIIMote{
    constructor(device){
        this.device = device;
        this.buttonStatus = {
            "DPAD_LEFT" : false,
            "DPAD_RIGHT": false,
            "DPAD_DOWN": false,
            "DPAD_UP": false,
            "PLUS": false,
            "TWO": false,
            "ONE": false,
            "B": false,
            "A": false,
            "MINUS": false,
            "HOME": false
        };
        this.ledStatus = [
            false,  //led 1
            false,  //led 2
            false,  //led 3
            false   //led 4 
        ];

        this.rumblingStatus = false

        this.AccListener = null
        this.BtnListener = null
        this.StickListener = null
        this.NunBtnListener = null
        this.RobotListener = null;

       
        setTimeout( this.initiateDevice(), 200);
    }

    // Initiliase the Wiimote
    initiateDevice(){
        this.device.open().then(() => {
            this.sendReport(ReportMode.STATUS_INFO_REQ, [0x00])
            this.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_AND_EXT)
            this.initiateNunchuk()

            this.device.oninputreport = (e) => this.listener(e);
        })
    }

    initiateNunchuk(){
        // initialize nunchuk this way, it works just trust me
        // black magic, do not touch
        this.writeRegister(RegisterType.CONTROL, 0xa400f0, [0x55])
        this.writeRegister(RegisterType.CONTROL, 0xa400fb, [0x00])
    }

    // Send a data report
    sendReport(mode, data){
        return this.device.sendReport(
            mode,
            numbersToBuffer(data)
        ).catch(console.log)
    }

    // Toggle rumbling on the Wiimote
    toggleRumble(){
        var state = Rumble.ON;

        if(this.rumblingStatus){
            state = Rumble.OFF;
            this.rumblingStatus = false
        }else{
            this.rumblingStatus = true
        }

        this.sendReport(ReportMode.RUMBLE, [state])
    }

    setRumble(state){
        if (state) state = Rumble.ON;
        else state = Rumble.OFF;
        let status = state ? true : false;
        if (this.rumblingStatus != status){
            this.rumblingStatus = status;
            this.sendReport(ReportMode.RUMBLE, [state])
        }
    }

    // Encode LED Status
    LedEncoder( one, two, three, four ) {
        return (
          +Boolean(one) * LEDS.ONE +
          +Boolean(two) * LEDS.TWO +
          +Boolean(three) * LEDS.THREE +
          +Boolean(four) * LEDS.FOUR
        );
    }

    // Toggle an LED
    toggleLed(id, set){
        if (set === undefined){
            this.ledStatus[id] = !this.ledStatus[id];
            this.sendReport(ReportMode.PLAYER_LED, [this.LedEncoder(...this.ledStatus)]);
        }
        else if (this.ledStatus[id] != set){ 
            this.ledStatus[id] = set;
            return this.sendReport(ReportMode.PLAYER_LED, [this.LedEncoder(...this.ledStatus)])
        }
        
    }

    // Write the the Wiimote register
    writeRegister(type, offset, data){
        let offsetArr = toBigEndian(offset, 3);
        let dataLength = data.length;
        
        for (let index = 0; index < 16-dataLength; index++) {
            data.push(0x00);
        }
        
        var total = [type, ...offsetArr, dataLength, ...data];
        //console.log(ReportMode.MEM_REG_WRITE.toString(16), debug( total, false) )

        this.sendReport(ReportMode.MEM_REG_WRITE, total)
    }

    // Set the Data output type 
    setDataTracking(dataMode = DataReportMode.CORE_BUTTONS_ACCEL_AND_EXT){
        return this.sendReport(ReportMode.DATA_REPORTING, [0x00, dataMode]);
    }

    // Decode the Accelerometer data
    ACCDecoder(data){
        if(this.AccListener != null){
            this.AccListener(...data);
        }
    }

    // Decode the IR Camera data
    IRDecoder(data){
        var tracked_objects = []

        for (let index = 0; index < 12; index+=3) {
            if(data[index] != 255 && data[index+1] != 255 && data[index+2] != 255){
                var x = data[index];
                var y = data[index+1];
                var size = data[index+2];

                x |= (size & 0x30) << 4;
                y |= (size & 0xc0) << 2;

                tracked_objects.push({
                    x: x,
                    y: y,
                    s: size
                });
            }
        }
    }

    // Toggle button status in 
    toggleButton(name, value){
        if(name == "" || name == undefined) return

        this.buttonStatus[name] = (value != 0)
    }

    // Decode the button data
    BTNDecoder(byte1, byte2){
        for (let i = 0; i < 8; i++) {
            let byte1Status = getBitInByte(byte1, i+1)
            let byte2Status = getBitInByte(byte2, i+1)

            this.toggleButton(BUTTON_BYTE1[i], byte1Status)
            this.toggleButton(BUTTON_BYTE2[i], byte2Status)

            if(this.BtnListener != null){
                this.BtnListener(this.buttonStatus)
            }
        }
    }

    // main listener received input from the Wiimote
    listener(event){
        var data = new Uint8Array(event.data.buffer);
        const [byte1, byte2,    // buttons
            accX, accY, accZ,
            stickX, stickY, naccX, naccY, naccZ, buttons,  // Nunchuk
            other   // IR Camera
        ] = data;

        let zbtn = buttons % 2;
        let cbtn = (buttons >> 1) % 2;

        if(event.reportId == InputReport.STATUS){
            this.setDataTracking(DataReportMode.CORE_BUTTONS_ACCEL_AND_EXT);
        }

        this.BTNDecoder(byte1, byte2);
        // this.ACCDecoder([accX, accY, accZ]);
        // this.StickListener(stickX, stickY);
        // this.NunBtnListener(cbtn, zbtn);
        let A = this.buttonStatus['A'];
        let B = this.buttonStatus['B'];
        let two = this.buttonStatus['TWO'];
        let up = this.buttonStatus['DPAD_UP'];
        let down = this.buttonStatus['DPAD_DOWN'];
        let plus = this.buttonStatus['PLUS'];
        
        this.RobotListener(A, B, two, stickX, stickY, cbtn, zbtn, up, down, plus, accY);
        
    }
}