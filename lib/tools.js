'use strict'

import dayjs from 'dayjs'

export const compileMean = function (history, now = dayjs()) {
  const beforeLastMonth = now.startOf('month').subtract(1, 'month')
  const beforeYesterday = now.startOf('day').subtract(1, 'day')
  const before2HoursAgo = now.startOf('hour').subtract(2, 'hour')

  history = history.reduce((acc, { t, v, i, m, M }) => {
    v = Number.parseFloat(v)
    m = Number.parseFloat(m)
    M = Number.parseFloat(M)
    const time = dayjs(t)
    let newTime

    if (time.isBefore(beforeLastMonth)) {
      newTime = time.startOf('day').add(12, 'hour')
    } else if (time.isBefore(beforeYesterday)) {
      newTime = time.startOf('hour').add(30, 'minute')
    } else if (time.isBefore(before2HoursAgo)) {
      newTime = time.startOf('minute').add(30, 'second')
    } else {
      acc.push({ t, v, i, m, M })
      return acc
    }

    let existing = acc.find(e => e.t === newTime.valueOf() && e.i === i)
    if (!existing) {
      existing = { t: newTime.valueOf(), v, vs: [], i, m: v, M: v }
      acc.push(existing)
    }
    existing.vs.push(v)
    existing.m = Math.min(existing.m, m, v)
    existing.M = Math.max(existing.M, M, v)
    return acc
  }, [])

  return history.map(({ t, v, vs, i, m, M }) => {
    if (vs && vs.length) {
      v = Number.parseFloat(Number.parseFloat(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(6))
    }
    return { t, v, i, m, M }
  })
}

export const compileTruncate = function (history, now = dayjs()) {
  const beforeLastMonth = now.startOf('month').subtract(1, 'month')
  const beforeYesterday = now.startOf('day').subtract(1, 'day')
  const before2HoursAgo = now.startOf('hour').subtract(2, 'hour')

  history = history.reduce((acc, { t, v, i, m, M }) => {
    v = Number.parseFloat(v)
    m = Number.parseFloat(m)
    M = Number.parseFloat(M)
    const time = dayjs(t)

    // TODO !0: should compile, but not the same way !
    //  it's a meter that does only progress... so no mean,
    //  only keeping the value at the end of each grouped period (tronquer entre les périodes)
    acc.push({ t, v, i, m, M })

    return acc
  }, [])

  return history
}
