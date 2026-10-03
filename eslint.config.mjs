import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "scripts/**", // SQL, no JS/TS acá
      "*.config.{js,mjs,ts}",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // El codebase tiene cientos de `any` a propósito (Supabase sin tipos generados,
      // props sueltas). Subirlo a error ahora rompería la build sin arreglar nada real;
      // queda como warning hasta que se puedan tipar en serio.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",

      // eslint-config-next 16 trae de fábrica las reglas nuevas de
      // eslint-plugin-react-hooks v7, pensadas para preparar código para el React
      // Compiler. Esta app no usa el Compiler todavía y tiene ~100 casos existentes
      // (sobre todo "leer localStorage/navigator y hacer setState en el primer
      // render", un patrón normal y seguro). Entrar directo en "error" con esto
      // rompería la build sin que haya ningún bug real atrás. Quedan en warning:
      // es deuda técnica real para ir pagando, no algo para ignorar para siempre.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      // Cosmético (comillas sin escapar en JSX) y un solo caso en todo el repo:
      // no vale la pena tocar un archivo no relacionado para esto hoy.
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
  },
]
