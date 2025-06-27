// AIC Configuration utilities
export const config = {
  get: (key: string) => process.env[key]
}
