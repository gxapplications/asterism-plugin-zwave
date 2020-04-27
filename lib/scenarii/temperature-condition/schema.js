'use strict'

import Joi from '@hapi/joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave Temperature condition'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  limit: Joi.number().precision(1).min(-200.0).max(200.0).required().default(30.0),
  limit2: Joi.number().precision(1).min(-200.0).max(200.0).required().default(10.0),
  aggregation: Joi.string().required().valid('any', 'every', 'average').default('every'),
  operator: Joi.string().required().valid('above', 'below', 'between').default('between')
}

export default schema
