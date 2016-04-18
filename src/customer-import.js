import { SphereClient } from 'sphere-node-sdk'
import { generatePassword } from './utils'
import schema from './schema'
import Promise from 'bluebird'
import _ from 'lodash'
import initAjv from 'ajv'

const ajv = initAjv({ removeAdditional: true, coerceTypes: true })
const validate = ajv.compile(schema)

export default class CustomerImport {

  constructor (logger, { sphereClientConfig, importerConfig }) {
    this.logger = logger
    this.client = new SphereClient(sphereClientConfig)
    this.customerGroups = {}

    this.config = _.assign({
      defaultShippingAddress: null,
      defaultBillingAddress: null
    }, importerConfig)

    this.summary = {
      errors: [],
      inserted: [],
      successfullImports: 0
    }
  }

  summaryReport () {
    return JSON.stringify(this.summary, null, 2)
  }

  processStream (customers, next) {
    // process batch
    this.loadCustomerGroups()
    return Promise.map(customers, (customer) => {
      return this.importCustomer(customer)
    })
    .then(() => {
      // call next for next batch
      next()
    })
    // errors get catched in the node-cli which also calls for the next chunk
    // if an error occured in this chunk
  }

  importCustomer (customer) {
    // validate customer object
    return this.validateCustomer(customer)
    .then(() => {
      // try to import customer
      return this._importValidatedCustomer(customer)
      // check if customer already existed
      // update customer
      // successfully imported
    })
    .catch((error) => {
      this.summary.errors.push({ customer, error })
    })
  }

  _importValidatedCustomer (customer) {
    return new Promise((resolve, reject) => {
      // user does not exist yet -> generate password for him
      customer.password = generatePassword()
      if (_.isNumber(this.config.defaultShippingAddress)) {
        customer.defaultShippingAddressId = this.config.defaultShippingAddress
      }
      if (_.isNumber(this.config.defaultBillingAddress)) {
        customer.defaultBillingAddressId = this.config.defaultBillingAddress
      }
      // TODO should this be configurable?
      // so that you choose whether you already have customer group id or name
      this.getCustomerGroupId(customer.customerGroup)
      .then((groupId) => {
        if (groupId) {
          customer.customerGroup = this.buildCustomerGroupReference(groupId)
        }
        // customer object is valid
        return this.client.customers.save(customer)
      })
      .then(() => {
        this.summary.inserted.push(customer.email)
        this.summary.successfullImports = this.summary.successfullImports + 1
        resolve(customer)
      })
      .catch((error) => {
        // TODO: potentially handle duplicate field error here
        return reject(error)
      })
    })
  }

  loadCustomerGroups () {
    return _.keys(this.customerGroups).length === 0 ? this.client.customerGroups
    .process(({ body: { results: customerGroups } }) => {
      customerGroups.forEach((customerGroup) => {
        this.customerGroups[customerGroup.name] = customerGroup.id
      })
      return Promise.resolve()
    }) : Promise.resolve()
  }

  getCustomerGroupId (customerGroupName) {
    if (!customerGroupName) {
      return Promise.resolve()
    }
    const customerGroupId = this.customerGroups[customerGroupName]
    if (customerGroupId) {
      return Promise.resolve(customerGroupId)
    }
    return this.insertCustomerGroup(customerGroupName)
    .then(({ body: customerGroup }) => {
      return customerGroup.id
    })
  }

  buildCustomerGroupReference (id) {
    return {
      typeId: 'customer-group',
      id
    }
  }

  insertCustomerGroup (customerGroupName) {
    return this.client.customerGroups.create({ groupName: customerGroupName })
  }

  validateCustomer (customer) {
    const isValid = validate(customer)
    if (isValid) {
      return Promise.resolve()
    } else {
      return Promise.reject(validate.errors)
    }
  }
}
