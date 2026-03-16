import Button from "@/common/navbar/Button"
import LoadingOverlay from "./LoadingOverlay"
import { useAuth } from "@/context/AuthContext"
import useChangeEmail from "../hook/useChangeEmail"
import Modal from "@/common/modal"
import { useRouter } from "next/router"
import usePasswordVisibility from "@/features/login/hook/usePasswordVisibility"
import { Eye, EyeClosed } from 'lucide-react';
export default function ChangeEmailSection() {

    const router = useRouter()

    const { loading, logout } = useAuth()
    const { isVisible, inputType, toggleVisibility, } = usePasswordVisibility()
    const {
        form,
        errors,
        handleChange,
        submit,
        isLoading,
    } = useChangeEmail()

    const styleInput =
        "w-full body2 text-black bg-white border border-gray-400 rounded-lg p-3 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"

    const styleError = "border-purple"
    const styleErrortext = "body3 text-purple"
    const styleLabel = "body2 text-black"

    if (loading) {
        return <LoadingOverlay />
    }

    return (
        <div className="relative bg-white mx-auto min-h-screen flex flex-col items-center gap-8 px-4 py-10">

            <h3 className="headline3 text-black">Change Email</h3>

            <section className="z-10 w-full flex flex-col items-center gap-8 lg:w-[500px]">

                <form onSubmit={submit} className="flex flex-col gap-6 w-full">

                    {/* New Email */}

                    <div className="flex flex-col gap-1">

                        <label className={styleLabel}>New Email</label>

                        <input
                            name="newEmail"
                            type="email"
                            placeholder="Enter new email"
                            value={form.newEmail}
                            onChange={handleChange}
                            className={`${styleInput} ${errors.newEmail ? styleError : ""}`}
                        />

                        {errors.newEmail && (
                            <p className={styleErrortext}>{errors.newEmail}</p>
                        )}

                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className={styleLabel}>
                            Password
                        </label>
                        <div className={`w-full relative flex flex-row ${styleInput} ${errors.password ? styleError : ""}`} >
                            <input
                                id="password"
                                name="password"
                                type={inputType}
                                placeholder="Enter password"
                                value={form.password}
                                onChange={handleChange}
                                className="grow outline-none placeholder:text-gray-600"
                            />
                            {!errors.password && <button type="button" className="absolute right-4 top-4 cursor-pointer" onClick={toggleVisibility}>
                                {isVisible ? <Eye size={20} /> : <EyeClosed size={20} />}
                            </button>}
                            {errors.password && (<img src="/exclamation_circle.svg" alt="error icon" className="absolute right-4 top-4" />)}
                        </div>
                        {errors.password && (
                            <p className={styleErrortext}>{errors.password}</p>
                        )}
                    </div>

                    {errors.form && (
                        <p className="body3 text-purple text-center">
                            {errors.form}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isLoading}
                    >
                        {isLoading ? "Updating..." : "Update Email"}
                    </Button>

                </form>
            </section>
        </div>
    )
}