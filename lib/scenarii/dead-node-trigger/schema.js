'use strict'

import Joi from 'joi'

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch control'),
  nodeIds: Joi.array().items(Joi.number().required().default(0)).optional().default([])
}

export default schema
