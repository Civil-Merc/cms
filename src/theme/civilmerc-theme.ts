import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Effra', system-ui, sans-serif" },
        body: { value: "'Effra', system-ui, sans-serif" },
        mono: { value: "'D-DIN', ui-monospace, monospace" },
      },
      colors: {
        civilmerc: {
          gold: { value: "#fdc23e" },
          goldHover: { value: "#e5ad2a" },
          goldMuted: { value: "#c9a24a" },
          charcoal: { value: "#181818" },
          surface: { value: "#222222" },
          surfaceRaised: { value: "#2a2a2a" },
          border: { value: "#3a3a3a" },
          muted: { value: "#a3a3a3" },
        },
      },
    },
    recipes: {
      input: {
        base: {
          _hover: { borderColor: "transparent" },
          _focusVisible: {
            borderColor: "transparent",
            boxShadow: "none",
            outline: "none",
          },
        },
      },
      textarea: {
        base: {
          _hover: { borderColor: "transparent" },
          _focusVisible: {
            borderColor: "transparent",
            boxShadow: "none",
            outline: "none",
          },
        },
      },
    },
    semanticTokens: {
      colors: {
        civilmerc: {
          solid: { value: "{colors.civilmerc.gold}" },
          contrast: { value: "{colors.civilmerc.charcoal}" },
          fg: { value: "{colors.civilmerc.gold}" },
          muted: { value: "{colors.civilmerc.goldMuted}" },
          subtle: { value: "{colors.civilmerc.surfaceRaised}" },
          emphasized: { value: "{colors.civilmerc.goldHover}" },
          focusRing: { value: "{colors.civilmerc.gold}" },
        },
      },
    },
  },
  globalCss: {
    "html, body, #root": {
      minHeight: "100dvh",
    },
    body: {
      margin: 0,
      fontFamily: "body",
    },
  },
})

const civilmercSystem = createSystem(defaultConfig, config)

/** Primary CMS actions (Publish, Save content, etc.) */
export const primaryActionButton = {
  bg: "civilmerc.gold",
  color: "civilmerc.charcoal",
  fontWeight: "700",
  _hover: { bg: "civilmerc.goldHover", opacity: 0.75 },
  _active: { opacity: 0.6 },
} as const

export { civilmercSystem }
export default civilmercSystem
