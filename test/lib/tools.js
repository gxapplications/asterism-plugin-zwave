/* eslint-env mocha */
'use strict'

import { expect } from 'chai'
import dayjs from 'dayjs'
import { compileMean } from '../../lib/tools'

describe('Tools functions,', function () {
  const now = dayjs('2020-12-31T12:25:00.000Z')

  it('Can compile hourly dated history', function () {
    const data = [
      { t: dayjs('2020-12-30T09:22:00.000Z').valueOf(), v: 1, i: 1, m: 1, M: 1 },
      { t: dayjs('2020-12-30T09:22:12.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-12-30T09:22:18.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-12-31T08:23:00.000Z').valueOf(), v: 1, i: 1, m: 1, M: 1 },
      { t: dayjs('2020-12-31T08:23:12.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-12-31T08:24:00.000Z').valueOf(), v: 2, i: 1, m: 2, M: 2 },
      { t: dayjs('2020-12-31T12:23:00.000Z').valueOf(), v: 10, i: 1, m: 10, M: 10 },
      { t: dayjs('2020-12-31T12:24:00.000Z').valueOf(), v: 10, i: 1, m: 10, M: 10 }
    ]
    const compiled = compileMean(data, now)

    const expected = [ { t: 1609320150000, v: 3.666667, i: 1, m: 1, M: 5 },
      { t: 1609403010000, v: 3, i: 1, m: 1, M: 5 },
      { t: 1609403070000, v: 2, i: 1, m: 2, M: 2 },
      { t: 1609417380000, v: 10, i: 1, m: 10, M: 10 },
      { t: 1609417440000, v: 10, i: 1, m: 10, M: 10 } ]

    expect(compiled).to.deep.equal(expected)
  })

  it('Can compile daily dated history', function () {
    const data = [
      { t: dayjs('2020-12-27T09:22:00.000Z').valueOf(), v: 1, i: 1, m: 1, M: 1 },
      { t: dayjs('2020-12-27T09:22:12.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-12-27T09:22:18.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-12-27T09:23:00.000Z').valueOf(), v: 1, i: 1, m: 1, M: 1 },
      { t: dayjs('2020-12-27T09:23:12.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-12-27T10:24:00.000Z').valueOf(), v: 2, i: 1, m: 2, M: 2 },
      { t: dayjs('2020-12-31T12:23:00.000Z').valueOf(), v: 10, i: 1, m: 10, M: 10 },
      { t: dayjs('2020-12-31T12:24:00.000Z').valueOf(), v: 10, i: 1, m: 10, M: 10 }
    ]
    const compiled = compileMean(data, now)

    const expected = [
      { t: 1609061400000, v: 3.4, i: 1, m: 1, M: 5 },
      { t: 1609065000000, v: 2, i: 1, m: 2, M: 2 },
      { t: 1609417380000, v: 10, i: 1, m: 10, M: 10 },
      { t: 1609417440000, v: 10, i: 1, m: 10, M: 10 }
    ]

    expect(compiled).to.deep.equal(expected)
  })

  it('Can compile monthly dated history', function () {
    const data = [
      { t: dayjs('2020-09-26T09:22:00.000Z').valueOf(), v: 1, i: 1, m: 1, M: 1 },
      { t: dayjs('2020-09-26T09:22:12.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-09-27T09:22:18.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-09-27T09:23:00.000Z').valueOf(), v: 1, i: 1, m: 1, M: 1 },
      { t: dayjs('2020-09-27T09:23:12.000Z').valueOf(), v: 5, i: 1, m: 5, M: 5 },
      { t: dayjs('2020-09-27T10:24:00.000Z').valueOf(), v: 2, i: 1, m: 2, M: 2 },
      { t: dayjs('2020-12-31T12:23:00.000Z').valueOf(), v: 10, i: 1, m: 10, M: 10 },
      { t: dayjs('2020-12-31T12:24:00.000Z').valueOf(), v: 10, i: 1, m: 10, M: 10 }
    ]
    const compiled = compileMean(data, now)

    const expected = [
      { t: 1601114400000, v: 3, i: 1, m: 1, M: 5 },
      { t: 1601200800000, v: 3.25, i: 1, m: 1, M: 5 },
      { t: 1609417380000, v: 10, i: 1, m: 10, M: 10 },
      { t: 1609417440000, v: 10, i: 1, m: 10, M: 10 }
    ]

    expect(compiled).to.deep.equal(expected)
  })
})
