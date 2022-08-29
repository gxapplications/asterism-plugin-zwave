'use strict'

import dayjs from 'dayjs'

export const compileMean = function (history, now = dayjs()) {
  const beforeLastMonth = now.startOf('month').subtract(1, 'month')
  const beforeYesterday = now.startOf('day').subtract(1, 'day')
  const before2HoursAgo = now.startOf('hour').subtract(2, 'hour')

  history = history.reduce((acc, { t, v, i, m, M }) => {
    v = (v !== null) ? Number.parseFloat(v) : null
    m = (m !== null) ? Number.parseFloat(m) : null
    M = (M !== null) ? Number.parseFloat(M) : null
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
    if (v !== null) {
      existing.vs.push(v)
    }
    if (m !== null) {
      existing.m = Math.min(existing.m, m, v)
    }
    if (M !== null) {
      existing.M = Math.max(existing.M, M, v)
    }
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
  const beforeMonth = now.startOf('week').subtract(9, 'week') // one value per week
  const beforeToday = now.startOf('day').subtract(3, 'day') // one value per day
  const beforeHour = now.startOf('hour').subtract(2, 'hour') // one value per hour

  history = history.reduce((acc, { t, v, i }) => {
    v = Number.parseFloat(v)
    const time = dayjs(t)
    let newTime

    if (time.isBefore(beforeMonth)) {
      newTime = time.startOf('week').add(3, 'day').add(12, 'hour')
    } else if (time.isBefore(beforeToday)) {
      newTime = time.startOf('day').add(12, 'hour')
    } else if (time.isBefore(beforeHour)) {
      newTime = time.startOf('hour').add(30, 'minute')
    } else {
      acc.push({ t, v, i })
      return acc
    }

    let existing = acc.find(e => e.t === newTime.valueOf() && e.i === i)
    if (!existing) {
      existing = { t: newTime.valueOf(), v, i }
      acc.push(existing)
    } else {
      existing.v = v
    }

    return acc
  }, [])

  return history
}

export const roundTruncate = function (history, period) {
  history = history.reduce((acc, { t, v, i }) => {
    v = Number.parseFloat(v)
    const time = dayjs(t)
    let newTime = time.startOf(period).add(0.5, period)

    let existing = acc.find(e => e.t === newTime.valueOf() && e.i === i)
    if (!existing) {
      existing = { t: newTime.valueOf(), v, i }
      acc.push(existing)
    } else {
      existing.v = v
    }

    return acc
  }, [])

  return history
}