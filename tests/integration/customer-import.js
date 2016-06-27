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
      .then(() => deleteAll('customerGroups'))
      .then(() => deleteAll('types'))
      .then(() => {
        customerImport = new CustomerImport(
          logger,
          { sphereClientConfig: options }
        )
        done()
      })
    })
  })

  it('should import a complete customer', (done) => {
    const customer = {
      'customerNumber':'12341234',
      'firstName': 'Max',
      'lastName': 'Mustermann',
      'externalId': '1-nc0r98nc1-390r8cn-1309rcn8',
      'companyName':'Some random company',
      'addresses':[{
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
        const summary = JSON.parse(customerImport.summaryReport())
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
        const summary = JSON.parse(customerImport.summaryReport())
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
      companyName: 'Some random company',
      addresses: [{
        streetName: 'Musterstraße 123',
        postalCode: '11111',
        city: 'Stadt',
        country: 'DE'
      }]
    }
    customerImport.loadCustomerGroups()
    .then(() => customerImport.importCustomer(customer))
    .then(() => {
      const summary = JSON.parse(customerImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0

      expect(actual).to.equal(expected)
      return client.customers.where(`email="${customer.email}"`).fetch()
    })
    .then(({ body: { results: customers } }) => {
      const actual = _.omit(customers[0].addresses[0], 'id')
      const expected = customer.addresses[0]

      expect(actual).to.deep.equal(expected)
      done()
    })
    .catch(done)
  })

  it('should import a customer with a default shipping and billing address',
  (done) => {

    const customer = {
      email: 'philipp.sporrer@commercetools.de',
      companyName: 'Some random company',
      addresses: [{
        streetName: 'Musterstraße 123',
        postalCode: '11111',
        city: 'Stadt',
        country: 'DE'
      }]
    }
    customerImport.config.defaultShippingAddress = 0
    customerImport.config.defaultBillingAddress = 0
    customerImport.loadCustomerGroups()
    .then(() => customerImport.importCustomer(customer))
    .then(() => {
      const summary = JSON.parse(customerImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0

      expect(actual).to.equal(expected)
      return client.customers.where(`email="${customer.email}"`).fetch()
    })
    .then(({ body: { results: customers } }) => {
      const { id } = customers[0].addresses[0]

      expect(id).to.equal(customers[0].defaultBillingAddressId)
      expect(id).to.equal(customers[0].defaultShippingAddressId)
      done()
    })
    .catch(done)
  })

  it('should import a customer with custom fields', (done) => {

    let customer
    client.types.create({
      key: 'custom-customer',
      name: { en: 'custom customer' },
      resourceTypeIds: ['customer'],
      fieldDefinitions: [
        {
          name: 'customField1',
          type: { name: 'String' },
          required: false,
          label: { label: 'Custom field 1' },
          inputHint: 'SingleLine'
        },
        {
          name: 'customField2',
          type: { name: 'Boolean' },
          required: false,
          label: { en: 'Custom field 2' },
        }
      ]
    }).then(({ body: customType }) => {
      customer = {
        email: 'philipp.sporrer@commercetools.de',
        custom: {
          type: {
            key: customType.key
          },
          fields: {
            customField1: 'customValue1',
            customField2: true
          }
        }
      }
      return customerImport.importCustomer(customer)
    })
    .then(() => {
      const summary = JSON.parse(customerImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0

      expect(actual).to.equal(expected)
      client.customers.where(`email="${customer.email}"`).fetch()
      .then(({ body: { results: customers } }) => {
        const actual = customers[0].custom.fields
        const expected = customer.custom.fields

        expect(actual).to.deep.equal(expected)
        done()
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
        const summary = JSON.parse(customerImport.summaryReport())
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
      customerImport.loadCustomerGroups([customer])
      .then(() => {
        customerImport.importCustomer(customer)
        .then((customerWithGroupReference) => {
          const summary = JSON.parse(customerImport.summaryReport())
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

  it(`should import multiple customers with the same (new)
  customer group at once`, (done) => {
    const customers = [{
      email: 'philipp.sporrer@commercetools.de',
      customerGroup: 'commercetools'
    }, {
      email: 'nicola.molinary@commercetools.de',
      customerGroup: 'commercetools'
    }, {
      email: 'dali.zheng@commercetools.de',
      customerGroup: 'commercetools'
    }]
    customerImport.processStream(customers, () => null)
    .then(() => {
      const summary = JSON.parse(customerImport.summaryReport())
      const actual = summary.successfullImports
      const expected = 3

      expect(actual).to.equal(expected)
      done()
    })
    .catch(done)
  })

})
