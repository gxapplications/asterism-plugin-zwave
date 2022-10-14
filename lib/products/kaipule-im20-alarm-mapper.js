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
  7: (value) => ([value !== 'Clear', 'Burglar'])
}

alarmMapper[6].description = {
  label: 'Access control alarm (sensor opened)',
  shortLabel: 'Access Control',
  cases: {
    0: 'Clear',
    22: 'Door/Window Open',
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

export default alarmMapper
