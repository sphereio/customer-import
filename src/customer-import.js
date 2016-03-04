import { SphereClient } from 'sphere-node-sdk'
import Joi from 'joi'
import schema from './schema'
import Promise from 'bluebird'

const validate = Promise.promisify(Joi.validate)

export default class CustomerImport {

  constructor (logger, config) {
    this.logger = logger
    this.client = new SphereClient(config)

    this.summary = {
      errors: [],
      successfullImports: 0
    }
  }

  summaryReport () {
    return this.summary
  }

  performStream (batch, next) {
    // process batch
    // call next for next batch
    setTimeout(next, 1000)
  }

  importCustomer (customer) {
    // validate customer object
    return this.validateCustomer(customer)
    .then(() => {
      // customer object is valid
      // check if customer already exists
      // successfully imported
      this.summary.successfullImports = this.summary.successfullImports + 1
    })
    .catch((err) => {
      this.summary.errors.push({ customer, err })
    })
  }

  validateCustomer (customer) {
    return validate(customer, schema)
  }
}
