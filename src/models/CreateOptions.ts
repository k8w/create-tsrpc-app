export interface CreateOptions {
  projectDir: string
  server: 'http' | 'ws'
  client: ClientPlatform
  features: (ServerFeature | ClientFeature)[]
}

export type ClientPlatform = 'browser' | 'react' | 'vue3' | 'none' | 'node'

export type ServerFeature = 'unitTest'

export type ClientFeature = 'symlink' | 'tailwind'

export const serverFeatures: {
  name: string
  value: ServerFeature
  checked?: boolean
}[] = [
  // { name: '演示代码', value: 'demoCode', checked: true },
  // { name: i18n.featureUnitTest, value: 'unitTest' },
]

export const clientFeatures: {
  name: string
  value: ClientFeature
  checked?: boolean
  platforms: CreateOptions['client'][]
}[] = [
  {
    name: 'Tailwind CSS',
    value: 'tailwind',
    checked: true,
    platforms: ['browser', 'react', 'vue3'],
  },
  // { name: i18n.featureSymlink, value: 'symlink', platforms: ['browser', 'react', 'vue3'] }
]
