'use strict'

const alarmMapper = {
  4: (value) => ([value !== 'Clear', 'Heat']),
  6: (value) => {
    switch (value) {
      case 'Door/Window Open':
        return [true, 'Access Control']
      case 'Door/Window Closed':
      case 'Clear':
        return [false, 'Access Control']
    }
  },
  7: (value) => ([value !== 'Clear', 'Burglar']),
  8: (value) => ([value !== 'Clear', 'Power Management'])
}

alarmMapper[4].description = {
  label: 'Heat alarm (temperature out of bounds)',
  shortLabel: 'Heat',
  cases: {
    0: 'Clear',
    2: 'OverHeat at Unknown at Location',
    6: 'UnderHeat at Unknown Location',
    defaults: [2, 'OverHeat at Unknown at Location']
  }
}

alarmMapper[6].description = {
  label: 'Access control alarm (sensor opened/closed)',
  shortLabel: 'Access Control',
  cases: {
    0: 'Clear',
    22: 'Door/Window Open',
    23: 'Door/Window Closed',
    defaults: [22, 'Door/Window Open']
  }
}

alarmMapper[7].description = {
  label: 'Burglar alarm (sensor tampered, cover removed)',
  shortLabel: 'Burglar',
  cases: {
    0: 'Clear',
    3: 'Tampering -  Cover Removed',
    defaults: [3, 'Tampering -  Cover Removed']
  }
}

alarmMapper[8].description = {
  label: 'Power Management (power level critical)',
  shortLabel: 'Power',
  cases: {
    0: 'Clear',
    11: 'Replace Battery Now',
    defaults: [11, 'Replace Battery Now']
  }
}

export default alarmMapper
