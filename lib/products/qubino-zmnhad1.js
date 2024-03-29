'use strict'

import UnknownProduct from './unknown'
import NameLocationFromDataSupport from './mixin-name-location-from-data'
import BinarySwitchSupport from "./mixin-binary-switch";
import MeterSupport from "./mixin-meter";

/*
  NOT SUPPORTED YET: TODO !3
    <CommandClass id="113" name="COMMAND_CLASS_NOTIFICATION">
      <Value type="list" genre="user" instance="1" index="8" label="Power Management" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="2">
        <Help>Power Management Alerts</Help>
        <Item label="Clear" value="0" />
        <Item label="Over Load Detected" value="8" />
      </Value>
      <Value type="byte" genre="user" instance="1" index="256" label="Previous Event Cleared" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="0">
        <Help>Previous Event that was sent</Help>
      </Value>
    </CommandClass>


  SUPPORTED:
    <CommandClass id="50" name="COMMAND_CLASS_METER">
      <Value type="decimal" genre="user" instance="1" index="0" label="Electric - kWh" units="kWh" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" value="0.0">
      </Value>
      <Value type="decimal" genre="user" instance="1" index="2" label="Electric - W" units="W" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" value="0.0">
      </Value>
      <Value type="bool" genre="user" instance="1" index="256" label="Exporting" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" value="False">
      </Value>
      <Value type="button" genre="system" instance="1" index="257" label="Reset" units="" read_only="false" write_only="true" verify_changes="false" poll_intensity="0" min="0" max="0">
      </Value>
    </CommandClass>


  CONFIGURATION NOT SUPPORTED:
    <Value type="list" genre="config" instance="1" index="63" label="Output switch selection" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="1" vindex="0" size="1">
      <Help></Help>
      <Item label="When system is turned off the output is 0V (NC)" value="0" />
      <Item label="When system is turned off the output is 230V or 24V (NO)" value="1" />
    </Value>
    <Value type="list" genre="config" instance="1" index="100" label="Enable / Disable Endpoints I2 or select notification type and event" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="9" vindex="0" size="1">
      <Help></Help>
      <Item label="Endpoint, I2 disabled" value="0" />
      <Item label="Home Security; Motion Detection, unknown location" value="1" />
      <Item label="Carbon Monoxide; Carbon Monoxide detected, unknown location" value="2" />
      <Item label="Carbon Dioxide; Carbon Dioxide detected, unknown location" value="3" />
      <Item label="Water Alarm; Water Leak detected, unknown location" value="4" />
      <Item label="Heat Alarm; Overheat detected, unknown location" value="5" />
      <Item label="Smoke Alarm; Smoke detected, unknown location" value="6" />
      <Item label="Sensor binary" value="9" />
    </Value>
    <Value type="list" genre="config" instance="1" index="101" label="Enable / Disable Endpoints I3 or select notification type and event" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="9" vindex="0" size="1">
      <Help></Help>
      <Item label="Endpoint, I3 disabled" value="0" />
      <Item label="Home Security; Motion Detection, unknown location" value="1" />
      <Item label="Carbon Monoxide; Carbon Monoxide detected, unknown location" value="2" />
      <Item label="Carbon Dioxide; Carbon Dioxide detected, unknown location" value="3" />
      <Item label="Water Alarm; Water Leak detected, unknown location" value="4" />
      <Item label="Heat Alarm; Overheat detected, unknown location" value="5" />
      <Item label="Smoke Alarm; Smoke detected, unknown location" value="6" />
      <Item label="Sensor binary" value="9" />
    </Value>
    <Value type="short" genre="config" instance="1" index="110" label="Temperature sensor offset settings" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="32535" value="32535">
      <Help>Set value is added or subtracted to actual measured value by sensor. Available configuration parameters : default value 32536. 32536  offset is 0.0C. From 1 to 100 = value from 0.1C to 10.0C is added to actual measured temperature. From 1001 to 1100 = value from -0.1 C to -10.0 C is subtracted to actual measured temperature.</Help>
    </Value>
    <Value type="byte" genre="config" instance="1" index="120" label="Digital temperature sensor reporting" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="127" value="5">
      <Help>If digital temperature sensor is connected, module reports measured temperature on temperature change defined by this parameter. Available configuration parameters : 0 = reporting disabled. 1 to 127 = 0,1C to 12,7C, step is 0,1C. Default value is 5 = 0,5C</Help>
    </Value>
 */

class QubinoZmnhad1 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BinarySwitchSupport(1, 0),
  MeterSupport(1, 0),
  MeterSupport(1, 2)) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService
  }

  getName () {
    return super.getName() || QubinoZmnhad1.meta.name(this.node.nodeid)
  }
}

QubinoZmnhad1.meta = {
  name: (nodeid) => `On/Off switch module #${nodeid} (Qubino Flush 1 Relay)`,
  manufacturer: 'GOAP Qubino',
  manufacturerid: '0x0159',
  product: 'Flush 1 Relay ZMNHAD1',
  producttype: '0x0002',
  productid: '0x0052',
  type: 'On/Off switch module',
  passive: false,
  battery: false,
  icon: 'QubinoZmnhjd1', // same icon for many modules
  settingPanel: 'qubino-zmnhad1',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation',
    'binarySwitchTurnOn', 'binarySwitchTurnOff', 'binarySwitchTurnOnOff', 'binarySwitchInvert', 'binarySwitchGetState',
    'meterResetCounter', 'meterGetLastValue', 'meterGetAllValues', 'meterGetUnits', 'meterGetLabel', 'meterGetFormatted',
    'getConfiguration', 'setConfiguration'],
  configurations: {
    INPUT_1_SWITCH_TYPE: 1, // <Mono-stable switch type (push button)="0">  <Bi-stable switch type="1">
    INPUT_2_CONTACT_TYPE: 2, // <NO (normaly open) input type="0">  <NC (normaly close) input type="1">
    INPUT_3_CONTACT_TYPE: 3, // <NO (normaly open) input type="0">  <NC (normaly close) input type="1">
    ALL_ON_ALL_OFF: 10, // Activate / deactivate functions ALL ON/ALL OFF  <ALL ON active, ALL OFF active="255">  <ALL ON is not active ALL OFF is not active="0">  <ALL ON is not active ALL OFF active="1">  <ALL ON active ALL OFF is not active="2">
    AUTO_OFF_DELAY: 11, // Automatic turning off relay after set time    slider 0-32535    0 => Auto OFF disabled. 1 - 32535  => 1 second (0,01s) - 32535 seconds (325,35s). Auto OFF enabled with define time, step is 1s or 10ms according to parameter 15. Default value 0
    AUTO_ON_DELAY: 12, // Automatic turning on relay after set time      slider 0-32535    0 => Auto ON disabled. 1 - 32535  => 1 second (0,01s) - 32535 seconds (325,35s). Auto ON enabled with define time, step is 1s or 10ms according to parameter 15. Default value 0
    AUTO_OFF_ON_SCALE: 15, // Automatic turning on/off seconds or milliseconds selection  <seconds="0">  <milliseconds="1">
    RESET_DEVICE_STATUS_AFTER_A_POWER_FAILURE: 30, // Saving the state of the relay after a power failure   <Flush 1 relay module saves its state before power failure (it returns to the last position saved before a power failure)="0">  <Flush 1 relay module does not save the state after a power failure, it returns to off position.="1">
    POWER_REPORTING_THRESHOLD: 40, // Power reporting in Watts on power change     min="0"max="100" value="10"    Set value from 0 - 100 (0%- 100%). 0 = Reporting Disabled. 1 - 100 = 1% - 100% and reporting enabled. Power report is send (push) only when actual power in Watts in real time change for more than set percentage comparing to previous actual power in Watts, step is 1%. Default value 10%
    POWER_REPORTING_INTERVAL: 42 // Power reporting in Watts by time interval     min="0" max="32535" value="300"     Set value means time interval (0 - 32535) in seconds, when power report is send. 0 = Reporting Disabled. 1 - 32535 = 1 second - 32535 seconds and reporting enabled. Power report is send with time interval set by entered value. Default value 300 (power report in Watts is send each 300s)
  }
}

export default QubinoZmnhad1
