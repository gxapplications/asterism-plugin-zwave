'use strict'

const alarmMapper = {
  7: (value) => ([value !== 'Clear', 'Burglar']),
  14: (value) => ([value !== 'Clear', 'Active'])
}

alarmMapper[7].description = {
  label: 'Burglar alarm (siren tampered, cover removed)',
  shortLabel: 'Burglar',
  cases: {
    0: 'Clear',
    3: 'Tampering -  Cover Removed',
    defaults: [3, 'Tampering -  Cover Removed']
  }
}

alarmMapper[14].description = {
  label: 'Siren Alerts',
  shortLabel: 'Siren',
  cases: {
    0: 'Clear',
    1: 'Active',
    defaults: [1, 'Active']
  }
}

export default alarmMapper
