'use strict'

import AeotecZStickGen5 from './aeotec-zstickgen5'
import FibaroFgdw002 from './fibaro-fgdw002'
import FibaroFgrgbwm441 from './fibaro-fgrgbwm441'
import FibaroFgwpe102zw5 from './fibaro-fgwpe102zw5'
import FibaroFgwpe102zw5V2 from './fibaro-fgwpe102zw5-v2'
import HankHkzwscn04 from './hank-hkzwscn04'

import StandardBinarySwitch from './standard-binary-switch'
import UnknownProduct from './unknown'

const products = {
    '0086-0001-005a': AeotecZStickGen5,
    '010f-0702-1000': FibaroFgdw002,
    '010f-0900-1000': FibaroFgrgbwm441,
    '010f-0602-1001': FibaroFgwpe102zw5,
    '010f-0602-1003': FibaroFgwpe102zw5V2,
    '0208-0200-000b': HankHkzwscn04,

    'standard-binary-switch': StandardBinarySwitch,
    'unknown': UnknownProduct
}

export default products
