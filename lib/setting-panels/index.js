'use strict'

import FibaroFgdw002 from './fibaro-fgdw002'
import FibaroFgrgbwm441 from './fibaro-fgrgbwm441'
import FibaroFgwpe102zw5 from './fibaro-fgwpe102zw5'
import QubinoZmnhjd1 from './qubino-zmnhjd1'
import HankHkzwscn04 from './hank-hkzwscn04'

import StandardBinarySwitchSettingPanel from './standard-binary-switch'
import UnknownSettingPanel from './unknown-product'

const settingPanels = {
    'fibaro-fgdw002': FibaroFgdw002,
    'fibaro-fgrgbwm441': FibaroFgrgbwm441,
    'fibaro-fgwpe102zw5': FibaroFgwpe102zw5,
    'qubino-zmnhjd1': QubinoZmnhjd1,
    'hank-hkzwscn04': HankHkzwscn04,

    'standard-binary-switch': StandardBinarySwitchSettingPanel,
    'unknown': UnknownSettingPanel
}

export default settingPanels
