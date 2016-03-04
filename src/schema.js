import Joi from 'joi'

const schema = Joi.object().keys({
  customerNumber: Joi.string(),
  companyName: Joi.string(),
  streetName: Joi.string(),
  postalCode: Joi.number(),
  city: Joi.string(),
  country: Joi.string(),
  email: Joi.string().required(),
  phone: Joi.string(),
  customerGroup: Joi.string(),
  vatId: Joi.string()
})

export default schema
