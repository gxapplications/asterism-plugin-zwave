'use strict'

import AeotecZstickgen5SettingPanel from './aeotec-zstickgen5'
import CoolcamSiren from './coolcam-siren'
import FibaroFgs224 from './fibaro-fgs224'
import FibaroFgdw002 from './fibaro-fgdw002'
import FibraoFgpb101 from './fibaro-fgpb101'
import FibaroFgrgbwm441 from './fibaro-fgrgbwm441'
import FibaroFgwpe102zw5 from './fibaro-fgwpe102zw5'
import PhilioPse04 from './philio-pse04'
import QubinoZmnhad1 from './qubino-zmnhad1'
import QubinoZmnhjd1 from './qubino-zmnhjd1'
import HankHkzwdws01 from './hank-hkzwdws01'
import HankHkzwscn04 from './hank-hkzwscn04'
import HeimanHs1sazSettingPanel from './heiman-hs1saz'
import KaipuleIm20SettingPanel from './kaipule-im20'

import StandardBinarySwitch from './standard-binary-switch'
import UnknownSettingPanel from './unknown-product'

const settingPanels = {
  'aeotec-zstickgen5': AeotecZstickgen5SettingPanel,
  'coolcam-siren': CoolcamSiren,
  'fibaro-fgs224': FibaroFgs224,
  'fibaro-fgdw002': FibaroFgdw002,
  'fibaro-fgpb101': FibraoFgpb101,
  'fibaro-fgrgbwm441': FibaroFgrgbwm441,
  'fibaro-fgwpe102zw5': FibaroFgwpe102zw5,
  'philio-pse04': PhilioPse04,
  'qubino-zmnhad1': QubinoZmnhad1,
  'qubino-zmnhjd1': QubinoZmnhjd1,
  'hank-hkzwdws01': HankHkzwdws01,
  'hank-hkzwscn04': HankHkzwscn04,
  'heiman-hs1saz': HeimanHs1sazSettingPanel,
  'kaipule-im20': KaipuleIm20SettingPanel,

  'standard-binary-switch': StandardBinarySwitch,
  'unknown': UnknownSettingPanel
}

export default settingPanels
