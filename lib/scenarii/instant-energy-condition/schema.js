'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave Instant energy condition'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  limit: Joi.number().integer().min(0).max(7000).required().default(1000),
  limit2: Joi.number().integer().min(0).max(7000).required().default(100),
  aggregation: Joi.string().required().valid('any', 'every', 'sum').default('any'),
  operator: Joi.string().required().valid('above', 'below', 'between').default('above')
}

export default schema
