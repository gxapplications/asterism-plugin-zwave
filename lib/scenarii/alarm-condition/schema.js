'use strict'

import Joi from '@hapi/joi'

const event = {
  nodeId: Joi.number().required().default(0),
  type: Joi.number().integer().min(0).required().default(0),
  state: Joi.boolean().required().allow(null).default(true)
  // depending on product alarm mixin implementation. AlarmMapper filter returns this boolean value (and a label).
  // null is allowed for 'unknown' case
}

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave alarm trigger'),
  events: Joi.array().items(Joi.object().keys(event)).optional().default([]),
  aggregation: Joi.string().required().valid('any', 'every').default('any')
}

export default schema
