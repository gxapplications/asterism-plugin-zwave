'use strict'

const alarmMapper = {
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

alarmMapper[6].description = {
  label: 'Access control alarm (sensor opened/closed)',
  shortLabel: 'Access Control',
  cases: {
    0: 'Clear',
    22: 'Door/Window Open',
    23: 'Door/Window Closed',
    defaults: [22]
  }
}

alarmMapper[7].description = {
  label: 'Burglar alarm (sensor tampered, cover removed)',
  shortLabel: 'Burglar',
  cases: {
    0: 'Clear',
    3: 'Tampering -  Cover Removed',
    defaults: [3]
  }
}

alarmMapper[8].description = {
  label: 'Power Management (power level critical)',
  shortLabel: 'Power',
  cases: {
    0: 'Clear',
    11: 'Replace Battery Now',
    defaults: [11]
  }
}

export default alarmMapper
