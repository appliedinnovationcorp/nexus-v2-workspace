import { CollectionConfig } from 'payload/types'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'division', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, originalDoc, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'division',
      type: 'select',
      options: [
        { label: 'General', value: 'general' },
        { label: 'SMB', value: 'smb' },
        { label: 'Enterprise', value: 'enterprise' },
        { label: 'Nexus', value: 'nexus' },
        { label: 'Investors', value: 'investors' },
      ],
      defaultValue: 'general',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Gradient', value: 'gradient' },
            { label: 'Video', value: 'video' },
            { label: 'Image', value: 'image' },
          ],
          defaultValue: 'default',
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'subtitle',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'image',
          },
        },
        {
          name: 'videoUrl',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'video',
          },
        },
        {
          name: 'ctaButtons',
          type: 'array',
          maxRows: 2,
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
            {
              name: 'style',
              type: 'select',
              options: [
                { label: 'Primary', value: 'primary' },
                { label: 'Secondary', value: 'secondary' },
                { label: 'Outline', value: 'outline' },
              ],
              defaultValue: 'primary',
            },
          ],
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Text Block', value: 'textBlock' },
            { label: 'Feature Grid', value: 'featureGrid' },
            { label: 'CTA Section', value: 'ctaSection' },
            { label: 'Testimonials', value: 'testimonials' },
            { label: 'FAQ', value: 'faq' },
            { label: 'Contact Form', value: 'contactForm' },
          ],
          required: true,
        },
        {
          name: 'textBlock',
          type: 'group',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'textBlock',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
            {
              name: 'content',
              type: 'richText',
              localized: true,
            },
            {
              name: 'alignment',
              type: 'select',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              defaultValue: 'left',
            },
          ],
        },
        {
          name: 'featureGrid',
          type: 'group',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'featureGrid',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
            },
            {
              name: 'subtitle',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'features',
              type: 'array',
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  admin: {
                    description: 'Lucide icon name (e.g., "brain", "zap", "shield")',
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  localized: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                  required: true,
                  localized: true,
                },
                {
                  name: 'link',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'ctaSection',
          type: 'group',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'ctaSection',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'buttons',
              type: 'array',
              maxRows: 2,
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'style',
                  type: 'select',
                  options: [
                    { label: 'Primary', value: 'primary' },
                    { label: 'Secondary', value: 'secondary' },
                    { label: 'Outline', value: 'outline' },
                  ],
                  defaultValue: 'primary',
                },
              ],
            },
            {
              name: 'backgroundColor',
              type: 'select',
              options: [
                { label: 'Default', value: 'default' },
                { label: 'Primary Gradient', value: 'primary-gradient' },
                { label: 'Dark', value: 'dark' },
              ],
              defaultValue: 'default',
            },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'keywords',
          type: 'text',
          localized: true,
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'aiGenerated',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'isAIGenerated',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'prompt',
          type: 'textarea',
          admin: {
            condition: (_, siblingData) => siblingData?.isAIGenerated,
          },
        },
        {
          name: 'model',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.isAIGenerated,
          },
        },
        {
          name: 'generatedAt',
          type: 'date',
          admin: {
            condition: (_, siblingData) => siblingData?.isAIGenerated,
            readOnly: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // Auto-generate slug if not provided
          if (!data.slug && data.title) {
            data.slug = data.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        // Trigger search index update
        if (doc.status === 'published') {
          // TODO: Update search index
          console.log(`Page ${operation}: ${doc.title}`)
        }
      },
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
