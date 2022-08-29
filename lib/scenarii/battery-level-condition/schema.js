'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave power condition'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([]),
  limit: Joi.number().integer().min(0).max(100).required().default(10),
  limit2: Joi.number().integer().min(0).max(100).required().default(0), // limit2 always < limit
  operator: Joi.string().required().valid('above', 'below', 'between').default('below')
}

export default schema
