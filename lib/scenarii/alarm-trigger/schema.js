'use strict'

import Joi from 'joi'

const event = {
  nodeId: Joi.number().required().default(0),
  type: Joi.number().integer().min(0).required().default(0),
  cases: Joi.array().items(Joi.number().integer().min(0).max(255).allow('others')).default([])
}

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave alarm trigger'),
  events: Joi.array().items(Joi.object().keys(event)).optional().default([])
}

export default schema
