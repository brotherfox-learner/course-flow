function isFutureDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date > today
}

function isInvalidBirthYear(date) {
  const year = date.getFullYear()
  const currentYear = new Date().getFullYear()
  return year < 1900 || year > currentYear
}

function isUnderAge(date, min = 12) {
  const today = new Date()
  const minBirthDate = new Date(
    today.getFullYear() - min,
    today.getMonth(),
    today.getDate()
  )
  return date > minBirthDate
}

export function validateRegister(form) {
  const errors = {}

  if (!form.firstName?.trim()) {
    errors.firstName = "First name is required"
  }

  if (!form.lastName?.trim()) {
    errors.lastName = "Last name is required"
  }

  if (!form.birthDate) {
    errors.birthDate = "Date of birth is required"
  } else {
    const date = form.birthDate

    if (isFutureDate(date) || isInvalidBirthYear(date)) {
      errors.birthDate = "Invalid date of birth"
    } else if (isUnderAge(date, 12)) {
      errors.birthDate = "You must be at least 12 years old"
    }
  }

  if (!form.email) {
    errors.email = "Email is required"
  }
  if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = "Invalid email format"
  }

  if (!form.password || form.password.length < 8) {
    errors.password = "Password must be at least 8 characters"
  }

  return errors
}