import nextConfig from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Codebase uses `any` extensively — suppress to keep CI green
      "@typescript-eslint/no-explicit-any": "off",
      // Unused vars expected during active development
      "@typescript-eslint/no-unused-vars": "off",
      // Hooks deps — existing code has intentional omissions
      "react-hooks/exhaustive-deps": "warn",
      // JSX unescaped entities — many apostrophes in UI text
      "react/no-unescaped-entities": "off",
      // setState synchronously in effect — existing pattern in this codebase
      "react-hooks/set-state-in-effect": "off",
      // Anonymous default exports in test/util files
      "import/no-anonymous-default-export": "off",
    },
  },
]

export default eslintConfig
