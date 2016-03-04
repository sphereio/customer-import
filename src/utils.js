import { SphereClient } from 'sphere-node-sdk'
import { ProjectCredentialsConfig } from 'sphere-node-utils'

const getSphereClient = (projectKey) => {
  return ProjectCredentialsConfig.create()
  .then((credentials) => {
    const sphereCredentials = credentials.enrichCredentials({
      project_key: projectKey
    })
    return Promise.resolve(new SphereClient({ config: sphereCredentials }))
  })
}

export {
  getSphereClient
}
