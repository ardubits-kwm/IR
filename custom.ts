
/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */



 //--------- Enum valiable----------------------   

// IR blocks supporting a ET-IR Remote Key  

const enum IrButton 
{
  //% block="⛔️"
      Power = 162,
  //% block=" "
      Any = -1,
  //% block="MENU"
      Menu = 226,

  //% block="TEST"
      Test = 34,
  //% block="➕"
      Add = 2,
  //% block="↪️"
      Return = 194,
  
  //% block="⏮"
      Left = 224 ,
  //% block="▶️"
      Play =  168,
  //% block="⏭"
      Right = 144,

  //% block="0"
      Num0 = 104,
  //% block="➖"
      Sub = 152,
  //% block="C"
      C = 176,

  //% block="1"
      Num1 = 48,
  //% block="2"
      Num2 = 24,
  //% block="3"
      Num3 = 122,

  //% block="4"
      Num4 = 16,
  //% block="5"
      Num5 = 56,
  //% block="6"
      Num6 = 90,

  //% block="7"
      Num7 = 66,
  //% block="8"
      Num8 = 74,
  //% block="9"
     Num9 = 82
    
}

const enum IrButtonAction 
{
  //% block="pressed"
  Pressed = 0,
  //% block="released"
  Released = 1,
}

const enum IrProtocol 
{
  //% block="Keyestudio"
  Keyestudio = 0,
  //% block="NEC"
  NEC = 1,
}

/**++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
   ++                            Custom blocks                     ++
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

//% weight=125 color="#9932cd" icon="\uf09e"    

namespace IR_RemoteRx 
{
  let irState: IrState;

  const MICROBIT_MAKERBIT_IR_NEC = 777;
  const MICROBIT_MAKERBIT_IR_DATAGRAM = 778;
  const MICROBIT_MAKERBIT_IR_BUTTON_PRESSED_ID = 789;
  const MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID = 790;
  const IR_REPEAT = 256;
  const IR_INCOMPLETE = 257;
  const IR_DATAGRAM = 258;

  interface IrState {protocol: IrProtocol; hasNewDatagram: boolean; bitsReceived: uint8; addressSectionBits: uint16;
                    commandSectionBits: uint16;hiword: uint16;loword: uint16;}


/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 ++                                Sub CustomBox                                   ++
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

/*+++++++++++++++++++++++++++++++++++++++++++++++++++++ 
 +  Function:Appemdbit To Datagram.                   +       
 +  Input: bit = Decimal Number 0-9  ไม่เกิน 8 หลัก      +        
 ++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

    function appendBitToDatagram(bit: number): number 
    {
        irState.bitsReceived += 1;

        if (irState.bitsReceived <= 8) 
        {
            irState.hiword = (irState.hiword << 1) + bit;

            if(irState.protocol === IrProtocol.Keyestudio && bit === 1) 
            {
            // recover from missing message bits at the beginning
            // Keyestudio address is 0 and thus missing bits can be detected
            // by checking for the first inverse address bit (which is a 1)
                irState.bitsReceived = 9;
                irState.hiword = 1;
            }
        } 
        else if (irState.bitsReceived <= 16) 
        {
            irState.hiword = (irState.hiword << 1) + bit;

        } 
        else if (irState.bitsReceived <= 32) 
        {
            irState.loword = (irState.loword << 1) + bit;
        }

        if (irState.bitsReceived === 32) 
        {                                            
            irState.addressSectionBits = irState.hiword & 0xffff;
            irState.commandSectionBits = irState.loword & 0xffff;
        
            return IR_DATAGRAM;
        } 
        else 
        {
            return IR_INCOMPLETE;
        }

    } //End Function appen


/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  ++                                                                     ++
  ++                              Function:Decode                        ++
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  ++                                                                     ++
  ++       Input :                                                       ++
  ++                  markAndSpace =                                     ++
  ++                                                                     ++
  +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

    function decode(markAndSpace: number): number 
    {
        if(markAndSpace < 1600)          // low bit
        {   
             return appendBitToDatagram(0);
        } 
        else if (markAndSpace < 2700)    // high bit
        {
            return appendBitToDatagram(1);
        }

        irState.bitsReceived = 0;

        if(markAndSpace < 12500)    // Repeat detected
        {
            return IR_REPEAT;
        } 
        else if (markAndSpace < 14500) 
        {
            // Start detected
            return IR_INCOMPLETE;
        } 
        else 
        {
            return IR_INCOMPLETE;
        }

    } //End Function Decode




function enableIrMarkSpaceDetection(pin: DigitalPin) 
    {
    pins.setPull(pin, PinPullMode.PullNone);

    let mark = 0;
    let space = 0;

    pins.onPulsed(pin, PulseValue.Low, () => {
      // HIGH, see https://github.com/microsoft/pxt-microbit/issues/1416
                                                 
      mark = pins.pulseDuration();
    });

    pins.onPulsed(pin, PulseValue.High, () => {
      // LOW
                                      
      space = pins.pulseDuration();
      const status = decode(mark + space);

      if (status !== IR_INCOMPLETE) {
        control.raiseEvent(MICROBIT_MAKERBIT_IR_NEC, status);
      }

    });
  }


  /**
   * Connects to the IR receiver module at the specified pin and configures the IR protocol.
   * @param pin IR receiver pin, eg: DigitalPin.P0
   * @param protocol IR protocol, eg: IrProtocol.Keyestudio
   */

  // subcategory="IR Receiver"
  //% blockId="makerbit_infrared_connect_receiver"
  // block="connect IR receiver at pin %pin and decode %protocol"   
  //% block="connect IR receiver at pin %pin"
  //% pin.fieldEditor="gridpicker"
  //% pin.fieldOptions.columns=4
  //% pin.fieldOptions.tooltips="false"
  //% weight=90
  //export function connectIrReceiver( pin: DigitalPin,protocol: IrProtocol):void   @@@@@@
   export function connectIrReceiver( pin: DigitalPin):void 
   {
    if (irState) 
    {
      return;
    }

    irState = {
      //protocol: protocol,  @@@@@@@
      protocol : 1 ,
      bitsReceived: 0,
      hasNewDatagram: false,
      addressSectionBits: 0,
      commandSectionBits: 0,
      hiword: 0, // TODO replace with uint32
      loword: 0,
    };

                                               

    enableIrMarkSpaceDetection(pin);
   

    let activeCommand = -1;
    let repeatTimeout = 0;
    const REPEAT_TIMEOUT_MS = 120;

    control.onEvent(
      MICROBIT_MAKERBIT_IR_NEC,
      EventBusValue.MICROBIT_EVT_ANY,
      () => {
        const irEvent = control.eventValue();

        // Refresh repeat timer
        if (irEvent === IR_DATAGRAM || irEvent === IR_REPEAT) {
          repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
        }

        if (irEvent === IR_DATAGRAM) {
          irState.hasNewDatagram = true;
          control.raiseEvent(MICROBIT_MAKERBIT_IR_DATAGRAM, 0);

          const newCommand = irState.commandSectionBits >> 8;

          // Process a new command
          if (newCommand !== activeCommand) {
            if (activeCommand >= 0) {
              control.raiseEvent(
                MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,
                activeCommand
              );
            }

            activeCommand = newCommand;
            control.raiseEvent(
              MICROBIT_MAKERBIT_IR_BUTTON_PRESSED_ID,
              newCommand
            );
          }
        }
      }
    );

    control.inBackground(() => {
      while (true) {
        if (activeCommand === -1) {
          // sleep to save CPU cylces
          basic.pause(2 * REPEAT_TIMEOUT_MS);
        } else {
          const now = input.runningTime();
          if (now > repeatTimeout) {
            // repeat timed out
            control.raiseEvent(
              MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,
              activeCommand
            );
            activeCommand = -1;
          } else {
            basic.pause(REPEAT_TIMEOUT_MS);
          }
        }
      }
    });
  }

  /**
   * Do something when a specific button is pressed or released on the remote control.
   * @param button the button to be checked
   * @param action the trigger action
   * @param handler body code to run when the event is raised
   */
  // subcategory="IR Receiver"
  //% blockId=makerbit_infrared_on_ir_button
  //% block="on IR button %button | %action"
  //% button.fieldEditor="gridpicker"
  //% button.fieldOptions.columns=3
  //% button.fieldOptions.tooltips="false"
  //% weight=50
  export function onIrButton(
    button: IrButton,
    action: IrButtonAction,
    handler: () => void
  ) {
    control.onEvent(
        action === IrButtonAction.Pressed
        ? MICROBIT_MAKERBIT_IR_BUTTON_PRESSED_ID
        : MICROBIT_MAKERBIT_IR_BUTTON_RELEASED_ID,

      button === IrButton.Any ? EventBusValue.MICROBIT_EVT_ANY : button,
      () => {
        handler();
      }
    );
  }

  

 

  









} /*End Custom Block*/
