import Button from "@/common/navbar/Button"
import useLogin from "../hook/useLogin"
import Link from "next/link"
import { Eye, EyeClosed } from 'lucide-react';
import usePasswordVisibility from "../hook/usePasswordVisibility";

function LoginSection() {
    const { form, errors, isLoading, handleChange, submit } = useLogin()
    const { isVisible, inputType, toggleVisibility, } = usePasswordVisibility()

    const styleInput =
        "w-full body2 text-black bg-white border border-gray-400 rounded-lg p-3 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
    const styleLabel = "body2 text-black"

    const styleError = "border-purple"


    return (
        <div className="relative bg-white min-h-screen px-4 py-10 overflow-hidden">
            <div className="space-y-10 mx-auto lg:max-w-[453px] lg:mt-[120px] relative z-10">
                <h3 className="headline3 text-dark-blue-500">
                    Welcome back!
                </h3>

                <form className="flex flex-col gap-10" onSubmit={submit}>
                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className={styleLabel}>
                            Email
                        </label>
                        <div className="w-full relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter Email"
                                value={form.email}
                                onChange={handleChange}
                                className={`${styleInput} ${errors.form ? styleError : ""}`}
                            />
                            {errors.form && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}
                        </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className={styleLabel}>
                            Password
                        </label>
                        <div className={`w-full relative flex flex-row ${styleInput} ${errors.form ? styleError : ""}`} >
                            <input
                                id="password"
                                name="password"
                                type={inputType}
                                placeholder="Enter password"
                                value={form.password}
                                onChange={handleChange}
                                className="grow outline-none"
                            />
                            {!errors.form && <button type="button" className="absolute right-4 top-4 cursor-pointer" onClick={toggleVisibility}>
                                {isVisible ? <Eye size={20} /> : <EyeClosed size={20} />}
                            </button>}
                            {errors.form && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}

                        </div>
                    </div>
                    {errors.form && (
                        <div className="flex flex-row gap-2 p-4 rounded-lg bg-purple/20">
                            <img src="/exclamation_circle.svg" alt="error icon" className="w-6 h-6" />
                            <p className="body2 text-purple">{errors.form}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <Button type="submit" disabled={isLoading} variant="primary" size="lg">
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </form>

                <div className="flex items-center gap-1">
                    <span className="body2 text-black">Don’t have an account?</span>
                    <Link href="/register">
                        <Button variant="ghost" size="ghost" className="text-[16px]" disabled={isLoading}>
                            Register
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="absolute left-[-80px] z-0 rotate-340 w-28 h-30 rounded-full bg-orange-100 lg:w-80 lg:h-83 lg:top-[200px] lg:left-[-250px]"></div>
            <div className="absolute left-[-15px] top-[-5px] w-8 h-8 rounded-full bg-blue-200 lg:w-19 lg:h-19 lg:top-[81px] lg:left-[87px]"></div>
            <img src="vector_7.svg" alt="blue shape" className="absolute right-0 top-[-32px] lg:hidden" />
            <img src="vector_8.svg" alt="blue shape" className="hidden absolute right-0 top-[-88px] lg:block" />
            <img src="orange_bold_circle.svg" alt="orange circle" className="absolute right-5 top-[200px] w-[10px] h-[9px] lg:hidden" />
            <img src="orange_circle.svg" alt="orange circle" className="hidden absolute right-15 top-[500px] lg:block" />
            <div className="hidden absolute top-[196px] left-[187px] text-[#2FAC61] text-5xl rotate-20 lg:block">+</div>
        </div>
    )
}

export default LoginSection