'use strict'

import Joi from '@hapi/joi'

const centralScene = {
  nodeId: Joi.number().required().default(0),
  centralSceneValue: Joi.any().required().default(''),
}

const schema = {
  name: Joi.string().required().default('Unconfigured Z-wave central scene trigger'),
  nodes: Joi.array().min(0).max(32).required().items(Joi.object().keys(centralScene)).default([])
}

export default schema
