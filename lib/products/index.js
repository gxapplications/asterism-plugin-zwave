'use strict'

import AeotecZStickGen5 from './aeotec-zstickgen5'
import FibaroFgdw002 from './fibaro-fgdw002'
import FibaroFgrgbwm441 from './fibaro-fgrgbwm441'
import FibaroFgwpe102zw5 from './fibaro-fgwpe102zw5'
import FibaroFgwpe102zw5V2 from './fibaro-fgwpe102zw5-v2'
import FibaroFgpb101 from './fibaro-fgpb101'
import FibaroFgs224 from './fibaro-fgs224'
import PhilioPse04 from './philio-pse04'
import QubinoFlushDimmerPilotWire from './qubino-zmnhjd1'
import HankHkzwdws01 from './hank-hkzwdws01'
import HankHkzwscn04 from './hank-hkzwscn04'
import KaipuleIm20 from './kaipule-im20'
import CoolcamSiren from './coolcam-siren'
import HeimanHs1saz from './heiman-hs1saz'

import StandardBinarySwitch from './standard-binary-switch'
import UnknownProduct from './unknown'

const products = {
  '0086-0001-005a': AeotecZStickGen5,
  '010f-0204-1000': FibaroFgs224,
  '010f-0702-1000': FibaroFgdw002,
  '010f-0900-1000': FibaroFgrgbwm441,
  '010f-0602-1001': FibaroFgwpe102zw5,
  '010f-0602-1003': FibaroFgwpe102zw5V2,
  '010f-0f01-1000': FibaroFgpb101,
  '013c-0004-0084': PhilioPse04,
  '0159-0004-0051': QubinoFlushDimmerPilotWire,
  '0208-0200-0008': HankHkzwdws01,
  '0208-0200-000b': HankHkzwscn04,
  '0214-0002-0001': KaipuleIm20,
  '0258-0003-1088': CoolcamSiren,
  '0260-8002-1000': HeimanHs1saz,

  'standard-binary-switch': StandardBinarySwitch,
  'unknown': UnknownProduct
}

export default products
