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

function isUnderAge(date) {
  const today = new Date()
  const minAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  return date > minAge
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
  } else if (
    isFutureDate(form.birthDate) ||
    isInvalidBirthYear(form.birthDate)
  ) {
    errors.birthDate = "Invalid date of birth"
  } else if (isUnderAge(form.birthDate)) {
    errors.birthDate = "You must be at least 13 years old"
  }

  if (!form.email) {
    errors.email = "Email is required"
  }

  if (!form.password || form.password.length < 8) {
    errors.password = "Password must be at least 8 characters"
  }

  return errors
}