import _ from 'lodash'
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

describe('customer import module', function () {

  this.timeout(10000)

  let client
  let customerImport

  beforeEach((done) => {
    getSphereClientCredentials(PROJECT_KEY)
    .then(sphereCredentials => {
      const options = {
        config: sphereCredentials
      }
      client = new SphereClient(options)

      customerImport = new CustomerImport(
        logger,
        { sphereClientConfig: options }
      )
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

  it('should import a complete customer', (done) => {
    const customer = {
      'customerNumber':'12341234',
      'addresses':[{
        'companyName':'Some random company',
        'streetName':'Musterstraße 123',
        'postalCode':'11111',
        'city':'Stadt',
        'country':'DE'
      }],
      'email':'test@test.xx',
      'phone':'0000000000',
      'randomField':'some random field',
      'customerGroup':'XX-Pruducenter',
      'vatId':'VADID123',
      'randomField2':'345.000,00'
    }
    customerImport.loadCustomerGroups()
    .then(() => {
      customerImport.importCustomer(customer)
      .then(() => {
        const summary = customerImport.summaryReport()
        const actual = summary.errors.length
        const expected = 0

        expect(actual).to.equal(expected)

        client.customers.where(`email="${customer.email}"`).fetch()
        .then(({ body: { results: customers } }) => {
          const actual = customers.length
          const expected = 1

          expect(actual).to.equal(expected)
          done()
        })
      })
      .catch(done)
    })
  })

  it('should import a customer without a customer group', (done) => {

    const customer = { email: 'philipp.sporrer@commercetools.de' }
    customerImport.loadCustomerGroups()
    .then(() => {
      customerImport.importCustomer(customer)
      .then(() => {
        const summary = customerImport.summaryReport()
        const actual = summary.errors.length
        const expected = 0

        expect(actual).to.equal(expected)

        client.customers.where(`email="${customer.email}"`).fetch()
        .then(({ body: { results: customers } }) => {
          const actual = customers.length
          const expected = 1

          expect(actual).to.equal(expected)
          done()
        })
      })
      .catch(done)
    })
  })

  it('should import a customer with an address', (done) => {

    const customer = {
      email: 'philipp.sporrer@commercetools.de',
      addresses: [{
        streetName: 'Ernst-Platz-Straße 45a',
        postalCode: '80992',
        city: 'München',
        country: 'DE'
      }]
    }
    customerImport.loadCustomerGroups()
    .then(() => {
      customerImport.importCustomer(customer)
      .then(() => {
        const summary = customerImport.summaryReport()
        const actual = summary.errors.length
        const expected = 0

        expect(actual).to.equal(expected)
        client.customers.where(`email="${customer.email}"`).fetch()
        .then(({ body: { results: customers } }) => {
          const actual = _.omit(customers[0].addresses[0], 'id')
          const expected = customer.addresses[0]

          expect(actual).to.deep.equal(expected)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should import a customer with a new customer group', (done) => {

    const customer = {
      email: 'philipp.sporrer@commercetools.de',
      customerGroup: 'commercetools'
    }
    customerImport.loadCustomerGroups()
    .then(() => {
      customerImport.importCustomer(customer)
      .then((customerWithGroupReference) => {
        const summary = customerImport.summaryReport()
        const actual = summary.errors.length
        const expected = 0

        expect(actual).to.equal(expected)

        client.customers.where(`email="${customer.email}"`).fetch()
        .then(({ body: { results: customers } }) => {
          const actual = _.pick(customers[0], ['email', 'customerGroup'])
          const expected = _.pick(
            customerWithGroupReference,
            ['email', 'customerGroup']
          )

          expect(actual).to.deep.equal(expected)
          done()
        })
      })
      .catch(done)
    })
  })

  it('should import a customer with an existing customer group', (done) => {

    const customer = {
      email: 'philipp.sporrer@commercetools.de',
      customerGroup: 'commercetools'
    }
    customerImport.insertCustomerGroup('commercetools')
    .then(() => {
      customerImport.loadCustomerGroups()
      .then(() => {
        customerImport.importCustomer(customer)
        .then((customerWithGroupReference) => {
          const summary = customerImport.summaryReport()
          const actual = summary.errors.length
          const expected = 0

          expect(actual).to.equal(expected)
          client.customers.where(`email="${customer.email}"`).fetch()
          .then(({ body: { results: customers } }) => {
            const actual = _.pick(customers[0], ['email', 'customerGroup'])
            const expected = _.pick(
              customerWithGroupReference,
              ['email', 'customerGroup']
            )

            expect(actual).to.deep.equal(expected)
            done()
          })
        })
        .catch(done)
      })
    })
  })

})
