'use strict'

import { AdditionalItem, ItemFactoryBuilder } from 'asterism-plugin-library'

import WallPlugItem from './wall-plug'
import WallPlugItemSettingPanel from './wall-plug-setting-panel'
import SensorMultiLevelItem from './sensor-multi-level'
import SensorMultiLevelItemSettingPanel from './sensor-multi-level-setting-panel'
import PilotWireItem from './pilot-wire'
import PilotWireItemSettingPanel from './pilot-wire-setting-panel'

const builder = new ItemFactoryBuilder()
.newItemType('zwave-wall-plug', AdditionalItem.categories.DOMOTICS)
  .withDescription('Z-wave Wall plug control', 'Control a Z-wave wall plug.')
  .settingPanelWithHeader('Wall plug settings', 'power') // optional override, but always before *Instance*() calls...
  .newInstanceFromInitialSetting(2, 2, WallPlugItemSettingPanel)
  .existingInstance(WallPlugItem, WallPlugItemSettingPanel)
  .acceptDimensions([
    { w: 1, h: 1 },
    { w: 2, h: 1 },
    { w: 1, h: 2 },
    { w: 2, h: 2 },
    { w: 3, h: 2 }
  ])
  .build()
.newItemType('zwave-sensor-multi-level', AdditionalItem.categories.DOMOTICS)
  .withDescription('Z-wave Sensor level', 'Show a Z-wave sensor level data.')
  .settingPanelWithHeader('Sensor level settings', 'bar_chart') // optional override, but always before *Instance*() calls...
  .newInstanceFromInitialSetting(2, 2, SensorMultiLevelItemSettingPanel)
  .existingInstance(SensorMultiLevelItem, SensorMultiLevelItemSettingPanel)
  .acceptDimensions([
    { w: 1, h: 1 },
    { w: 2, h: 1 },
    { w: 1, h: 2 },
    { w: 2, h: 2 },
    { w: 3, h: 2 }
  ])
  .build()
.newItemType('zwave-pilot-wire', AdditionalItem.categories.DOMOTICS)
  .withDescription('Z-wave Pilot wire control', 'Control a Z-wave pilot wire controller.')
  .settingPanelWithHeader('Pilot wire settings', 'brightness_4') // optional override, but always before *Instance*() calls...
  .newInstanceFromInitialSetting(2, 2, PilotWireItemSettingPanel)
  .existingInstance(PilotWireItem, PilotWireItemSettingPanel)
  .acceptDimensions([
    { w: 2, h: 2 },
    { w: 3, h: 2 },
    { w: 1, h: 3 },
    { w: 2, h: 3 },
    { w: 3, h: 3 },
    { w: 1, h: 4 },
    { w: 1, h: 5 }
  ])
  .build()

class ZwaveItemFactory extends builder.build() {
  // more custom functions here if needed...
}

export default ZwaveItemFactory
