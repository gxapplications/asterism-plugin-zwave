'use strict'

const alarmMapper = {
  1: (value) => {
    switch (value) {
      case 'Smoke Detected at Unknown Location':
        return [true, 'Smoke Alarm']
      case 'Clear':
        return [false, 'Smoke Alarm']
    }
  }
}

alarmMapper[1].description = {
  label: 'Smoke Alarm sensor',
  shortLabel: 'Smoke Alarm',
  cases: {
    0: 'Clear',
    2: 'Smoke Detected at Unknown Location',
    defaults: [2]
  }
}

export default alarmMapper
