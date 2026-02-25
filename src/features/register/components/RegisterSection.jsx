import Button from "@/common/navbar/Button"
import DatePickerInput from "./DatePicker"
import useRegister from "../hook/useRegister"
import Link from "next/link"
import { ComboBox } from "./ComboBox"

function RegisterSection() {
  const { form, errors, isLoading, handleChange, submit } = useRegister()

  const styleInput =
    "w-full body2 text-black bg-white border border-gray-400 rounded-lg p-3 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"

  const styleError = "border-purple"
  const styleErrortext = "body3 text-purple"
  const styleLabel = "body2 text-black"

  return (
    <div className="relative bg-white px-4 py-10 overflow-hidden">
      <div className="space-y-8 mx-auto lg:max-w-[453px] lg:mt-[20px] relative z-10">
        <h3 className="headline3 text-dark-blue-500">
          Register to start learning!
        </h3>

        <form
          className="flex flex-col gap-6"
          onSubmit={submit}
        >
          {/* First Name */}
          <div className="flex flex-col gap-1">
            <label className={styleLabel}>First Name</label>
            <div className="w-full relative">
              <input
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                value={form.firstName}
                onChange={handleChange}
                className={`${styleInput} ${errors.firstName ? styleError : ""}`}
              />
              {errors.firstName && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}
            </div>
            {errors.firstName && (
              <p className={styleErrortext}>{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1">
            <label className={styleLabel}>Last Name</label>
            <div className="w-full relative">
              <input
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                value={form.lastName}
                onChange={handleChange}
                className={`${styleInput} ${errors.lastName ? styleError : ""}`}
              />
              {errors.lastName && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}
            </div>
            {errors.lastName && (
              <p className={styleErrortext}>{errors.lastName}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1">
            <label className={styleLabel}>Date of Birth</label>
            <DatePickerInput
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className={`${styleInput} ${errors.birthDate ? styleError : ""}`}
            />
            {errors.birthDate && (
              <p className={styleErrortext}>{errors.birthDate}</p>
            )}
          </div>

          {/* Educational Background */}
          <div className="flex flex-col gap-1">
            <label className={styleLabel}>Educational Background</label>
            <ComboBox
              name="educationalBackground"
              value={form.educationalBackground}
              onChange={handleChange}
              inputClassName={`${styleInput}`}
              placeholder="Select educational background (optional)"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className={styleLabel}>Email</label>
            <div className="w-full relative">
              <input
                name="email"
                type="email"
                placeholder="Enter Email"
                value={form.email}
                onChange={handleChange}
                className={`${styleInput} ${errors.email ? styleError : ""}`}
              />
              {errors.email && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}
            </div>
            {errors.email && (
              <p className={styleErrortext}>{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className={styleLabel}>Password</label>
            <div className="w-full relative">
              <input
                name="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                className={`${styleInput} ${errors.password ? styleError : ""}`}
              />
              {errors.password && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}
            </div>
            {errors.password && (
              <p className={styleErrortext}>{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Register..." : "Register"}
          </Button>
        </form>
        <div className="flex items-center gap-1">
          <span className="body2 text-black">Already have an account?</span>
          <Link href="/login">
            <Button variant="ghost" size="ghost" className="text-[16px]" disabled={isLoading}>
              Log in
            </Button>
          </Link>
        </div>
      </div >
      <div className="absolute left-[-55px] bottom-7 z-0 rotate-340 w-22 h-30 rounded-full bg-orange-100 lg:w-80 lg:h-83 lg:top-[200px] lg:left-[-250px]"></div>
      <div className="absolute left-[-19px] top-[193px] w-8 h-8 rounded-full bg-blue-200 lg:w-19 lg:h-19 lg:top-[81px] lg:left-[87px]"></div>
      <img src="vector_7.svg" alt="blue shape" className="absolute right-0 top-43 lg:hidden" />
      <img src="vector_8.svg" alt="blue shape" className="hidden absolute right-0 top-[-88px] lg:block" />
      <img src="orange_bold_circle.svg" alt="orange circle" className="absolute right-4 top-[400px] w-[10px] h-[9px] lg:hidden" />
      <img src="orange_circle.svg" alt="orange circle" className="hidden absolute right-15 top-[500px] lg:block" />
      <div className="hidden absolute top-[196px] left-[187px] text-[#2FAC61] text-5xl rotate-20 lg:block">+</div>
    </div >
  )
}

export default RegisterSection

