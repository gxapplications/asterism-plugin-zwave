'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave Energy consumption condition'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  limit: Joi.number().integer().min(0).max(2000).required().default(50),
  limit2: Joi.number().integer().min(0).max(2000).required().default(0),
  aggregation: Joi.string().required().valid('any', 'every', 'sum').default('any'),
  unit: Joi.string().required().valid('kWh', 'cost').default('kWh'),
  operator: Joi.string().required().valid('above', 'below', 'between').default('above')
}

export default schema
