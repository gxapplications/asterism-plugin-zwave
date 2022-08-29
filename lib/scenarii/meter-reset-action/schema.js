'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave meter reset'),
  nodeIds: Joi.array().items(Joi.number().default(0)).optional().default([])
}

export default schema
