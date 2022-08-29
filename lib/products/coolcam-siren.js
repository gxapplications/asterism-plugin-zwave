'use strict'

import UnknownProduct from './unknown'
import BinarySwitchSupport from './mixin-binary-switch'
import BatteryLevelSupport from './mixin-battery-level'
import NameLocationFromDataSupport from './mixin-name-location-from-data'

/*
 https://products.z-wavealliance.org/products/3069?selectedFrequencyId=1

 Supported:
  binary switch: {"class_id":37,"instance":1,"index":0,"label":"Switch","value":false}.
  battery level: {"class_id":128,"instance":1,"index":0,"label":"Battery Level","value":100}.

 Configs indexes:
  {"class_id":112,"instance":1,"index":1,"label":"Alarm Music Volume","value":"High"}.
  {"class_id":112,"instance":1,"index":2,"label":"Alarm Music Duration Time","value":"1 minute"}.
  {"class_id":112,"instance":1,"index":3,"label":"Door Bell Music Duration Time","value":255}.
  {"class_id":112,"instance":1,"index":4,"label":"Door Bell Music Volume","value":"Low"}.
  {"class_id":112,"instance":1,"index":5,"label":"Alarm Music Index","value":"Beep"}.
  {"class_id":112,"instance":1,"index":6,"label":"Door Bell Music Index","value":"Beep Beep"}.
  {"class_id":112,"instance":1,"index":7,"label":"Configure Default Siren On Mode","value":"Alarm music"}.
  {"class_id":112,"instance":1,"index":8,"label":"Configure Alarm Led Enable","value":"Enable"}.
  {"class_id":112,"instance":1,"index":9,"label":"Door Bell Led Enable","value":"Disable"}.

 What is COMMAND_CLASS_INDICATOR ?
  {"class_id":135,"instance":1,"index":0,"label":"Indicator","value":0}.

 Alarms to support, or not ?:
  {"class_id":113,"instance":1,"index":256,"label":"Previous Event Cleared","value":0}.
  {"class_id":113,"instance":1,"index":14,"label":"Siren","value":"Clear"}.

 */
class CoolcamSiren extends UnknownProduct.with(
  NameLocationFromDataSupport(), // store name and location in DB (not supported by node itself)
  BinarySwitchSupport(1, 0),
  BatteryLevelSupport(0, { minLevel: 0, maxLevel: 100 }), // Adds battery level support
) {
  constructor (node, context) {
    super(node, context)
    this.zwave = context.zwave

    const c = CoolcamSiren.meta.configurations
    this.requestConfigurations(
      c.ALARM_SOUND_VOLUME,
      c.ALARM_SOUND_DURATION_TIME,
      c.DOOR_BELL_SOUND_DURATION_TIME,
      c.DOOR_BELL_SOUND_VOLUME,
      c.ALARM_SOUND_INDEX,
      c.DOOR_BELL_SOUND_INDEX,
      c.DEFAULT_SIREN_ON_MODE,
      c.ALARM_LED_ENABLED,
      c.DOOR_BELL_LED_ENABLED
    )
  }

  getName () {
    return super.getName() || CoolcamSiren.meta.name(this.node.nodeid)
  }
}

CoolcamSiren.meta = {
  name: (nodeid) => `Alarm Siren #${nodeid} (NeoCoolcam Siren)`,
  manufacturer: 'Coolcam',
  manufacturerid: '0x0258',
  product: 'NAS-AB02ZE',
  producttype: '0x0003',
  productid: '0x1088',
  type: 'Siren',
  passive: false,
  battery: true,
  icon: 'CoolcamSiren',
  settingPanel: 'coolcam-siren',
  settingPanelProvidedFunctions: ['getName', 'getLocation', 'setName', 'setLocation',
    'batteryLevelGetPercent', 'batteryLevelGetIcon',
    'getConfiguration', 'setConfiguration', 'binarySwitchTurnOn', 'binarySwitchTurnOff',
    'binarySwitchTurnOnOff', 'binarySwitchInvert', 'binarySwitchGetState'],
  configurations: {
    ALARM_SOUND_VOLUME: 1,
    ALARM_SOUND_DURATION_TIME: 2,
    DOOR_BELL_SOUND_DURATION_TIME: 3,
    DOOR_BELL_SOUND_VOLUME: 4,
    ALARM_SOUND_INDEX: 5,
    DOOR_BELL_SOUND_INDEX: 6,
    DEFAULT_SIREN_ON_MODE: 7,
    ALARM_LED_ENABLED: 8,
    DOOR_BELL_LED_ENABLED: 9
  }
}

export default CoolcamSiren
