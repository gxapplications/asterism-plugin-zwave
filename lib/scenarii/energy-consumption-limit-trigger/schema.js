'use strict'

import Joi from '@hapi/joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave energy consumption limit trigger'),
  nodeId: Joi.number().required().default(0),
  limit: Joi.number().min(0.1).max(2000).required().default(50),
  unit: Joi.string().required().valid('kWh', 'cost').default('kWh')
}

export default schema
