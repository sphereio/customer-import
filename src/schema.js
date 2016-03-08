import Joi from 'joi'

const schema = Joi.object().keys({
  customerNumber: Joi.string(),
  companyName: Joi.string(),
  addresses: Joi.array().items(Joi.object().keys({
    streetName: Joi.string(),
    postalCode: Joi.number(),
    city: Joi.string(),
    country: Joi.string().min(2).max(2)
  })),
  email: Joi.string().required(),
  phone: Joi.string(),
  customerGroup: Joi.string(),
  vatId: Joi.string()
})

export default schema
