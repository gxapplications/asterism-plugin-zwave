'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave temperature trigger'),
  nodeId: Joi.number().required().default(0),
  limit: Joi.number().precision(1).min(-200.0).max(200.0).required().default(30.0),
  way: Joi.string().required().valid('increasing', 'decreasing').default('increasing')
}

export default schema
