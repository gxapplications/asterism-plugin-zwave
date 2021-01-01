'use strict'

import AeotecZstickgen5SettingPanel from './aeotec-zstickgen5'
import CoolcamSiren from './coolcam-siren'
import FibaroFgdw002 from './fibaro-fgdw002'
import FibraoFgpb101 from './fibaro-fgpb101'
import FibaroFgrgbwm441 from './fibaro-fgrgbwm441'
import FibaroFgwpe102zw5 from './fibaro-fgwpe102zw5'
import QubinoZmnhjd1 from './qubino-zmnhjd1'
import HankHkzwdws01 from './hank-hkzwdws01'
import HankHkzwscn04 from './hank-hkzwscn04'

import StandardBinarySwitch from './standard-binary-switch'
import UnknownSettingPanel from './unknown-product'

const settingPanels = {
  'aeotec-zstickgen5': AeotecZstickgen5SettingPanel,
  'coolcam-siren': CoolcamSiren,
  'fibaro-fgdw002': FibaroFgdw002,
  'fibaro-fgpb101': FibraoFgpb101,
  'fibaro-fgrgbwm441': FibaroFgrgbwm441,
  'fibaro-fgwpe102zw5': FibaroFgwpe102zw5,
  'qubino-zmnhjd1': QubinoZmnhjd1,
  'hank-hkzwdws01': HankHkzwdws01,
  'hank-hkzwscn04': HankHkzwscn04,

  'standard-binary-switch': StandardBinarySwitch,
  'unknown': UnknownSettingPanel
}

export default settingPanels
