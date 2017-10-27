'use strict'

import AeotecZStickGen5 from './aeotec-zstickgen5'
import FibaroFgwpe102zw5 from './fibaro-fgwpe102zw5'

import UnknownProduct from './unknown'

const products = {
    '0086-0001-005a': AeotecZStickGen5,
    '010f-0602-1001': FibaroFgwpe102zw5,

    'unknown': UnknownProduct
}

export default products
