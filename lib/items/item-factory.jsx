'use strict'

import { AdditionalItem, ItemFactoryBuilder } from 'asterism-plugin-library'

import WallPlugItem from './wall-plug'
import WallPlugItemSettingPanel from './wall-plug-setting-panel'

const builder = new ItemFactoryBuilder()
.newItemType('zwave-wall-plug', AdditionalItem.categories.DOMOTICS)
  .withDescription('Wall plug control', 'Control a wall plug.')
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


class ZwaveItemFactory extends builder.build() {
  // more custom functions here if needed...
}

export default ZwaveItemFactory
