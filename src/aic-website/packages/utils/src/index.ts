// AIC Utility functions
export const utils = {
  formatDate: (date: Date) => date.toISOString(),
  slugify: (text: string) => text.toLowerCase().replace(/\s+/g, '-')
}
