import { buildConfig } from 'payload/config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'

// Collections
import { Users } from './collections/Users'
import { Pages } from './collections/Pages'
import { BlogPosts } from './collections/BlogPosts'
import { CaseStudies } from './collections/CaseStudies'
import { Resources } from './collections/Resources'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'

// Globals
import { SiteSettings } from './globals/SiteSettings'
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- AIC CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    css: path.resolve(__dirname, 'styles/admin.css'),
  },
  editor: slateEditor({}),
  collections: [
    Users,
    Pages,
    BlogPosts,
    CaseStudies,
    Resources,
    Leads,
    Media,
  ],
  globals: [
    SiteSettings,
    Navigation,
    Footer,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URL!,
  }),
  cors: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'https://aicorp.com',
    'https://smb.aicorp.com',
    'https://enterprise.aicorp.com',
    'https://nexus.aicorp.com',
    'https://investors.aicorp.com',
  ],
  csrf: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'https://aicorp.com',
    'https://smb.aicorp.com',
    'https://enterprise.aicorp.com',
    'https://nexus.aicorp.com',
    'https://investors.aicorp.com',
  ],
  upload: {
    limits: {
      fileSize: 50000000, // 50MB
    },
  },
  plugins: [
    // Add plugins here as needed
  ],
  hooks: {
    afterChange: [
      async ({ doc, collection, operation }) => {
        // Trigger search index update when content changes
        if (['pages', 'blog-posts', 'case-studies', 'resources'].includes(collection.slug)) {
          // TODO: Implement search index update
          console.log(`Content updated: ${collection.slug}/${doc.id}`)
        }
      },
    ],
  },
})
