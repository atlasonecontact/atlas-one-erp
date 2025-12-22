"use client"

import { useState, useCallback } from "react"

export type ValidationRule<T = string> = {
  validate: (value: T, allValues?: Record<string, any>) => boolean
  message: string
}

export type FieldValidation = {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  min?: number | { value: number; message: string }
  max?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  email?: boolean | string
  phone?: boolean | string
  cuit?: boolean | string
  custom?: ValidationRule | ValidationRule[]
}

export type FormValidations<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidation
}

export type FormErrors<T extends Record<string, any>> = {
  [K in keyof T]?: string
}

// Common regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_AR: /^(\+?54)?[\s-]?9?[\s-]?[0-9]{2,4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}$/,
  CUIT: /^(20|23|24|25|26|27|30|33|34)-?[0-9]{8}-?[0-9]$/,
  ONLY_NUMBERS: /^[0-9]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NO_SPECIAL_CHARS: /^[a-zA-Z0-9\s]+$/,
  BARCODE: /^[0-9]{8,13}$/,
  URL: /^https?:\/\/.+/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
}

// Validate CUIT/CUIL checksum
export function validateCuit(cuit: string): boolean {
  const cleaned = cuit.replace(/[-\s]/g, "")
  if (!/^[0-9]{11}$/.test(cleaned)) return false

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const digits = cleaned.split("").map(Number)

  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * multipliers[i]
  }

  const remainder = sum % 11
  const verifier = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder

  return digits[10] === verifier
}

export function useFormValidation<T extends Record<string, any>>(
  validations: FormValidations<T>
) {
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Set<keyof T>>(new Set())

  const validateField = useCallback(
    (name: keyof T, value: any, allValues?: T): string | undefined => {
      const rules = validations[name]
      if (!rules) return undefined

      // Required
      if (rules.required) {
        const isEmpty = value === undefined || value === null || value === "" || 
          (Array.isArray(value) && value.length === 0)
        if (isEmpty) {
          return typeof rules.required === "string"
            ? rules.required
            : "Este campo es obligatorio"
        }
      }

      // Skip other validations if value is empty and not required
      if (value === undefined || value === null || value === "") {
        return undefined
      }

      const strValue = String(value)

      // Min length
      if (rules.minLength) {
        const min = typeof rules.minLength === "number" ? rules.minLength : rules.minLength.value
        const msg = typeof rules.minLength === "number"
          ? `Mínimo ${min} caracteres`
          : rules.minLength.message
        if (strValue.length < min) return msg
      }

      // Max length
      if (rules.maxLength) {
        const max = typeof rules.maxLength === "number" ? rules.maxLength : rules.maxLength.value
        const msg = typeof rules.maxLength === "number"
          ? `Máximo ${max} caracteres`
          : rules.maxLength.message
        if (strValue.length > max) return msg
      }

      // Min value (for numbers)
      if (rules.min !== undefined) {
        const min = typeof rules.min === "number" ? rules.min : rules.min.value
        const msg = typeof rules.min === "number"
          ? `El valor mínimo es ${min}`
          : rules.min.message
        const numValue = Number(value)
        if (!isNaN(numValue) && numValue < min) return msg
      }

      // Max value (for numbers)
      if (rules.max !== undefined) {
        const max = typeof rules.max === "number" ? rules.max : rules.max.value
        const msg = typeof rules.max === "number"
          ? `El valor máximo es ${max}`
          : rules.max.message
        const numValue = Number(value)
        if (!isNaN(numValue) && numValue > max) return msg
      }

      // Pattern
      if (rules.pattern) {
        const pattern = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value
        const msg = rules.pattern instanceof RegExp
          ? "Formato inválido"
          : rules.pattern.message
        if (!pattern.test(strValue)) return msg
      }

      // Email
      if (rules.email) {
        if (!PATTERNS.EMAIL.test(strValue)) {
          return typeof rules.email === "string"
            ? rules.email
            : "Email inválido"
        }
      }

      // Phone
      if (rules.phone) {
        // More lenient phone validation
        const cleanedPhone = strValue.replace(/[\s\-()]/g, "")
        if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
          return typeof rules.phone === "string"
            ? rules.phone
            : "Teléfono inválido (8-15 dígitos)"
        }
      }

      // CUIT
      if (rules.cuit) {
        if (!validateCuit(strValue)) {
          return typeof rules.cuit === "string"
            ? rules.cuit
            : "CUIT/CUIL inválido"
        }
      }

      // Custom validations
      if (rules.custom) {
        const customRules = Array.isArray(rules.custom) ? rules.custom : [rules.custom]
        for (const rule of customRules) {
          if (!rule.validate(value, allValues)) {
            return rule.message
          }
        }
      }

      return undefined
    },
    [validations]
  )

  const validateForm = useCallback(
    (values: T): boolean => {
      const newErrors: FormErrors<T> = {}
      let isValid = true

      for (const key of Object.keys(validations) as Array<keyof T>) {
        const error = validateField(key, values[key], values)
        if (error) {
          newErrors[key] = error
          isValid = false
        }
      }

      setErrors(newErrors)
      // Mark all fields as touched
      setTouched(new Set(Object.keys(validations) as Array<keyof T>))
      return isValid
    },
    [validations, validateField]
  )

  const validateSingleField = useCallback(
    (name: keyof T, value: any, allValues?: T) => {
      const error = validateField(name, value, allValues)
      setErrors((prev) => ({ ...prev, [name]: error }))
      return !error
    },
    [validateField]
  )

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched((prev) => new Set(prev).add(name))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
    setTouched(new Set())
  }, [])

  const clearFieldError = useCallback((name: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const getFieldError = useCallback(
    (name: keyof T): string | undefined => {
      return touched.has(name) ? errors[name] : undefined
    },
    [errors, touched]
  )

  const hasErrors = Object.keys(errors).length > 0

  return {
    errors,
    touched,
    hasErrors,
    validateForm,
    validateField: validateSingleField,
    setFieldTouched,
    clearErrors,
    clearFieldError,
    getFieldError,
  }
}

// Helper component for showing field errors
export function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
      <span className="inline-block w-1 h-1 bg-red-400 rounded-full" />
      {error}
    </p>
  )
}
