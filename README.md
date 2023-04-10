
# Extention IR Remote Receive for ET-IR Remot Key




## Usage

```blocks

IR_RemoteRx.connectIrReceiver(DigitalPin.P8)
IR_RemoteRx.onIrButton(IrButton.Power, IrButtonAction.Pressed, function () {
    basic.showString("PWR")
})

```
## OR 
```blocks

IR_RemoteRx.connectIrReceiver(DigitalPin.P8)
IR_RemoteRx.onIrDatagram(function () {
    basic.showString(IR_RemoteRx.irDatagram())
})

})

```


## Examples

### Receive Remote Key and Show numberKey at math On Display

```blocks

IR_RemoteRx.connectIrReceiver(DigitalPin.P8)
IR_RemoteRx.onIrButton(IrButton.Num1, IrButtonAction.Pressed, function () {
    basic.showString("1")
})
IR_RemoteRx.onIrButton(IrButton.Power, IrButtonAction.Pressed, function () {
    basic.showString("PWR")
})
IR_RemoteRx.onIrButton(IrButton.Num9, IrButtonAction.Pressed, function () {
    basic.showString("9")
})

```

## Use as Extension



