'use strict'

import Joi from 'joi'

const idAndInstance = {
  id: Joi.number().default(0),
  instance: Joi.number().default(1)
}

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave switch control'),
  nodes: Joi.array().items(Joi.object().keys(idAndInstance)).optional().default([]),
  controlMode: Joi.string().required().valid('invert', 'force-off', 'force-on').default('invert')
}

export default schema
