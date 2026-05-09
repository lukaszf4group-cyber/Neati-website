import { type SchemaTypeDefinition } from 'sanity'

import portfolio from '../schemas/portfolio'
import testimonial from '../schemas/testimonial'
import client from '../schemas/client'
import settings from '../schemas/settings'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [portfolio, testimonial, client, settings],
}
