const schema = {
  type: 'object',
  properties: {
    customerNumber: { type: 'string' },
    companyName: { type: 'string' },
    addresses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          streetName: { type: 'string' },
          postalCode:  { type: 'string' },
          company:  { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string', minLength: 2, maxLength: 2 },
        }
      },
    },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    middleName: { type: 'string' },
    title: { type: 'string' },
    anonymousCartId: { type: 'string' },
    dateOfBirth: { type: 'string' },
    externalId: { type: 'string' },
    isEmailVerified: { type: 'boolean' },
    email: { type: 'string' },
    phone: { type: 'string' },
    customerGroup: { type: 'string' },
    vatId: { type: 'string' },
    custom: {
      type: 'object',
      properties: {
        type: {
          type: 'object',
          properties: {
            key: {
              type: 'string'
            }
          }
        },
        fields: {
          type: 'object'
        }
      }
    }
  },
  required: ['email'],
  additionalProperties: false,
}

export default schema
