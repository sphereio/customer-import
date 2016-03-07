import { expect } from 'chai'
import CustomerImport from '../../src'
import { SphereClient } from 'sphere-node-sdk'
import { getSphereClientCredentials } from '../../src/utils'
import Promise from 'bluebird'

const PROJECT_KEY = 'sphere-node-sdk-dev'
const logger = {
  trace: console.log,
  debug: console.log,
  info: console.log,
  error: console.error
}

describe('customer import module', () => {

  let client
  let customerImport

  beforeEach((done) => {
    getSphereClientCredentials(PROJECT_KEY)
    .then(sphereCredentials => {
      const options = {
        config: sphereCredentials
      }
      client = new SphereClient(options)

      customerImport = new CustomerImport(logger, options)
      done()
    })
  })

  afterEach((done) => {
    // remove all customers
    const deleteAll = (service) => {
      return client[service].process(({ body: { results } }) => {
        return Promise.map(results, (customer) => {
          return client[service].byId(customer.id)
          .delete(customer.version)
        })
      })
    }
    deleteAll('customers')
    .then(() => {
      return deleteAll('customerGroups')
    })
    .then(() => {
      done()
    })
    .catch(done)
  })

  it('should import a customer without a customer group', (done) => {

    customerImport.loadCustomerGroups()
    .then(() => {
      customerImport.importCustomer({
        email: 'philipp.sporrer@commercetools.de'
      })
      .then(() => {
        const summary = customerImport.summaryReport()
        const actual = summary.errors.length
        const expected = 0

        expect(actual).to.equal(expected)
        done()
      })
      .catch(done)
    })
  })

  it('should import a customer with a new customer group', (done) => {

    customerImport.loadCustomerGroups()
    .then(() => {
      customerImport.importCustomer({
        email: 'philipp.sporrer@commercetools.de',
        customerGroup: 'commercetools'
      })
      .then(() => {
        const summary = customerImport.summaryReport()
        const actual = summary.errors.length
        const expected = 0

        expect(actual).to.equal(expected)
        done()
      })
      .catch(done)
    })
  })

  it('should import a customer with an existing customer group', (done) => {

    customerImport.insertCustomerGroup('commercetools')
    .then(() => {
      customerImport.loadCustomerGroups()
      .then(() => {
        customerImport.importCustomer({
          email: 'philipp.sporrer@commercetools.de',
          customerGroup: 'commercetools'
        })
        .then(() => {
          const summary = customerImport.summaryReport()
          const actual = summary.errors.length
          const expected = 0

          expect(actual).to.equal(expected)
          done()
        })
        .catch(done)
      })
    })
  })

})
