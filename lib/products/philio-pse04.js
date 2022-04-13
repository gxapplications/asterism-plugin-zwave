'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import NameLocationFromDataSupport from './mixin-name-location-from-data'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'

// Doc found:
// https://products.z-wavealliance.org/products/4191?selectedFrequencyId=1

/* Frames for retro-engineering
  node 26

    {"class_id":49,"instance":1,"index":1,"label":"Air Temperature","value":"72.01"}.
    {"class_id":49,"instance":1,"index":256,"label":"Air Temperature Units","value":"Fahrenheit"}.
    {"class_id":113,"instance":1,"index":7,"label":"Home Security","value":"Clear"}.
    {"class_id":113,"instance":1,"index":14,"label":"Siren","value":"Clear"}.
    {"class_id":113,"instance":1,"index":256,"label":"Previous Event Cleared","value":0}.
    {"class_id":121,"instance":1,"index":0,"label":"Number of Tones","value":6}.
    {"class_id":121,"instance":1,"index":1,"label":"Tones","value":"Inactive"}.
    {"class_id":121,"instance":1,"index":2,"label":"Volume","value":100}.
    {"class_id":121,"instance":1,"index":3,"label":"Default Tone","value":"Alarm (180 sec)"}.
    {"class_id":135,"instance":1,"index":80,"label":"Indicator: Node Identify","value":"Off"}.
    {"class_id":135,"instance":1,"index":2819,"label":"Indicator: Node Identify: On/Off Period","value":0}.
    {"class_id":135,"instance":1,"index":2820,"label":"Indicator: Node Identify: On/Off Cycles","value":0}.
    {"class_id":135,"instance":1,"index":2821,"label":"Indicator: Node Identify: On time within an On/Off period","value":0}.

    <CommandClass id="49" name="COMMAND_CLASS_SENSOR_MULTILEVEL">
            <Compatibility />
            <State>
                    <CCVersion>11</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>0</StaticRequests>
            </State>
            <Instance index="1" />
            <Value type="decimal" genre="user" instance="1" index="1" label="Air Temperature" units="F" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" value="74.78">
                    <Help>Air Temperature Sensor Value</Help>
            </Value>
            <Value type="list" genre="system" instance="1" index="256" label="Air Temperature Units" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="1">
                    <Help>Air Temperature Sensor Available Units</Help>
                    <Item label="Fahrenheit" value="1" />
            </Value>
    </CommandClass>
    <CommandClass id="90" name="COMMAND_CLASS_DEVICE_RESET_LOCALLY">
            <Compatibility />
            <State>
                    <CCVersion>1</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>4</StaticRequests>
            </State>
            <Instance index="1" />
    </CommandClass>
    <CommandClass id="112" name="COMMAND_CLASS_CONFIGURATION">
            <Compatibility />
            <State>
                    <CCVersion>1</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>4</StaticRequests>
            </State>
            <Instance index="1" />
    </CommandClass>
    <CommandClass id="113" name="COMMAND_CLASS_NOTIFICATION">
            <Compatibility />
            <State>
                    <CCVersion>8</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>0</StaticRequests>
            </State>
            <Instance index="1" />
            <Value type="list" genre="user" instance="1" index="7" label="Home Security" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="2">
                    <Help>Home Security Alerts</Help>
                    <Item label="Clear" value="0" />
                    <Item label="Tampering -  Cover Removed" value="3" />
            </Value>
            <Value type="list" genre="user" instance="1" index="14" label="Siren" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="2">
                    <Help>Siren Alerts</Help>
                    <Item label="Clear" value="0" />
                    <Item label="Active" value="1" />
            </Value>
            <Value type="byte" genre="user" instance="1" index="256" label="Previous Event Cleared" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="0">
                    <Help>Previous Event that was sent</Help>
            </Value>
    </CommandClass>
    <CommandClass id="121" name="COMMAND_CLASS_SOUND_SWITCH">
            <Compatibility />
            <State>
                    <CCVersion>1</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>4</StaticRequests>
            </State>
            <Instance index="1" />
            <Value type="byte" genre="system" instance="1" index="0" label="Number of Tones" units="" read_only="true" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="6">
                    <Help>The Number of Available Tones on the Node</Help>
            </Value>
            <Value type="list" genre="user" instance="1" index="1" label="Tones" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="0" size="6">
                    <Help>A List of Available Tones on the Device</Help>
                    <Item label="Inactive" value="0" />
                    <Item label="Fire (180 sec)" value="1" />
                    <Item label="Ambulance (180 sec)" value="2" />
                    <Item label="Police (180 sec)" value="3" />
                    <Item label="Alarm (180 sec)" value="4" />
                    <Item label="Ding Dong (3 sec)" value="5" />
                    <Item label="Beep (1 sec)" value="6" />
                    <Item label="Default Tone" value="255" />
            </Value>
            <Value type="byte" genre="config" instance="1" index="2" label="Volume" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="255" value="100">
                    <Help>The Volume to play the tone at</Help>
            </Value>
            <Value type="list" genre="config" instance="1" index="3" label="Default Tone" units="" read_only="false" write_only="false" verify_changes="false" poll_intensity="0" min="0" max="0" vindex="4" size="6">
                    <Help>The default tone to play when none is specified in a Play Command</Help>
                    <Item label="Inactive" value="0" />
                    <Item label="Fire (180 sec)" value="1" />
                    <Item label="Ambulance (180 sec)" value="2" />
                    <Item label="Police (180 sec)" value="3" />
                    <Item label="Alarm (180 sec)" value="4" />
                    <Item label="Ding Dong (3 sec)" value="5" />
                    <Item label="Beep (1 sec)" value="6" />
                    <Item label="Default Tone" value="255" />
            </Value>
    </CommandClass>
    <CommandClass id="142" name="COMMAND_CLASS_MULTI_CHANNEL_ASSOCIATION">
            <Compatibility />
            <State>
                    <CCVersion>1</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>4</StaticRequests>
            </State>
            <Instance index="1" />
            <Associations num_groups="1">
                    <Group index="1" max_associations="1" label="Group 1" auto="true" multiInstance="true">
                            <Node id="1" />
                    </Group>
            </Associations>
    </CommandClass>

 */

class PhilioPse04 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
  SensorMultiLevelSupport(1)
  // TODO !1
) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave
    this.logger = context.logger
    this.dataHandler = context.dataHandler
    this.privateSocketIo = context.privateSocketIo
    this.scenariiService = context.scenariiService

    const c = PhilioPse04.meta.configurations
    this.requestConfigurations(
      c.AUTO_REPORT_TICK_INTERVAL,
      c.SOUND_DURATION,
      c.CUSTOMER_FUNCTION,
      c.AUTO_REPORT_TEMPERATURE_TIME,
      c.TEMPERATURE_DIFFERENTIAL_REPORT,
      c.AUTO_REPORT_BATTERY_TIME,
      c.PLAY_SOUND_CONTROL
    )
  }

  getName () {
    return super.getName() || PhilioPse04.meta.name(this.node.nodeid)
  }

  getPlaySoundControlConf () {
    const conf = this.getConfiguration(PhilioPse04.meta.configurations.PLAY_SOUND_CONTROL)
    return { soundLevel: conf & 0b00000011, soundTone: (conf & 0b11110000) >> 4 }
  }

  setPlaySoundControlConf (conf) {
    const existingConf = this.getPlaySoundControlConf()
    if (conf.soundLevel !== undefined && conf.soundLevel !== null) {
      existingConf.soundLevel = conf.soundLevel
    }
    if (conf.soundTone !== undefined && conf.soundTone !== null) {
      existingConf.soundTone = conf.soundTone
    }
    this.setConfiguration(
      PhilioPse04.meta.configurations.PLAY_SOUND_CONTROL,
      (existingConf.soundTone << 4) + existingConf.soundLevel
    )
  }

  getCustomerFunctionConf () {
    const conf = this.getConfiguration(PhilioPse04.meta.configurations.CUSTOMER_FUNCTION)
    return {
      disableTriggerAlarm: !!(conf & 0b00000001),
      disableSound: !!(conf & 0b00000010),
      temperatureUnitInCelsius: !!(conf & 0b00000100)
    }
  }

  setCustomerFunctionConf (conf) {
    const existingConf = this.getCustomerFunctionConf()
    if (conf.disableTriggerAlarm !== undefined && conf.disableTriggerAlarm !== null) {
      existingConf.disableTriggerAlarm = !!conf.disableTriggerAlarm
    }
    if (conf.disableSound !== undefined && conf.disableSound !== null) {
      existingConf.disableSound = !!conf.disableSound
    }
    if (conf.temperatureUnitInCelsius !== undefined && conf.temperatureUnitInCelsius !== null) {
      existingConf.temperatureUnitInCelsius = !!conf.temperatureUnitInCelsius
    }
    this.setConfiguration(
      PhilioPse04.meta.configurations.CUSTOMER_FUNCTION,
      (existingConf.disableTriggerAlarm ? 1 : 0) +
      ((existingConf.disableSound ? 1 : 0) << 1) +
      ((existingConf.temperatureUnitInCelsius ? 1 : 0) << 2)
    )
  }
}

PhilioPse04.meta = {
  name: (nodeid) => `Multiple Sound Siren #${nodeid} (Philio)`,
  manufacturer: 'Philio',
  manufacturerid: '0x013c',
  product: 'PSE04',
  producttype: '0x0004',
  productid: '0x0084',
  type: 'Siren',
  passive: false,
  battery: true,
  icon: 'PhilioPse04',
  settingPanel: 'philio-pse04',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation', 'getConfiguration', 'setConfiguration',
    'batteryLevelGetPercent', 'batteryLevelGetIcon', 'sensorMultiLevelGetLabel', 'sensorMultiLevelGetUnits',
    'sensorMultiLevelGetFormatted', 'sensorMultiLevelGetValue', 'sensorMultiLevelGetHistory',
    'getPlaySoundControlConf', 'setPlaySoundControlConf', 'getCustomerFunctionConf', 'setCustomerFunctionConf'], // TODO !0
  configurations: {
    AUTO_REPORT_TICK_INTERVAL: 1, // 0-255, def 30 => unit ???
    SOUND_DURATION: 2, // 0-255, def 6 => x*30seconds
    CUSTOMER_FUNCTION: 3, // bitmask, def 0=0b00000000
    // => 0b00000xx1: 1 to disable trigger alarm ; 0b00000x1x: 1 to disable sound
    // => 0b000001xx: temperature unit, 1=°C, 0=°F
    AUTO_REPORT_TEMPERATURE_TIME: 4, // 0-255, def 12 => unit ???
    TEMPERATURE_DIFFERENTIAL_REPORT: 5, // 0-255, def 0  => unit ???
    AUTO_REPORT_BATTERY_TIME: 6, // 0-255, def 12 => unit ???
    PLAY_SOUND_CONTROL: 7 // bitmask, def 67=0b01000011
    // => 0bxxxx0001: sound level 1 ; 0bxxxx0010: sound level 2 ; 0bxxxx0011: sound level 3 (default)
    // => 0b000000xx: stop play ; 0b000100xx: fire sound ; 0b001000xx: ambulance sound ; 0b001100xx: police sound
    // => 0b010000xx: alarm sound (default) ; 0b010100xx: dingdong sound ; 0b011000xx: beep sound
  }
}

export default PhilioPse04
