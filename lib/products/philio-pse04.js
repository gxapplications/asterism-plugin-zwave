'use strict'

import UnknownProduct from './unknown'
import BatteryLevelSupport from './mixin-battery-level'
import NameLocationFromDataSupport from './mixin-name-location-from-data'
import SensorMultiLevelSupport from './mixin-sensor-multi-level'
import AlarmSupport from './mixin-alarm'
import alarmMapper from './philio-pse04-alarm-mapper'

// Doc found:
// https://products.z-wavealliance.org/products/4191?selectedFrequencyId=1

/* Frames for retro-engineering
    <CommandClass id="90" name="COMMAND_CLASS_DEVICE_RESET_LOCALLY">
            <Compatibility />
            <State>
                    <CCVersion>1</CCVersion>
                    <InNif>true</InNif>
                    <StaticRequests>4</StaticRequests>
            </State>
            <Instance index="1" />
    </CommandClass>
 */

class PhilioPse04 extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
  SensorMultiLevelSupport(1),
  AlarmSupport(alarmMapper)
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

  playTone (tone) {
    this.zwave.setValue(this.node.nodeid, 32, 1, 0, tone || 0)
  }

  setToneAndVolume (tone, volume) {
    this.zwave.setValue(this.node.nodeid, 121, 1, 2, volume || 0)
    this.zwave.setValue(this.node.nodeid, 121, 1, 3, tone || 0)
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
    'getPlaySoundControlConf', 'setPlaySoundControlConf', 'getCustomerFunctionConf', 'setCustomerFunctionConf',
    'alarmGetLastLabel', 'alarmGetLabelHistory', 'alarmIsOn', 'alarmGetSupportedLabels', 'playTone', 'setToneAndVolume'],
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
