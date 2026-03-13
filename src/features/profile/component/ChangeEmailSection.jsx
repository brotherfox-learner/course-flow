import Button from "@/common/navbar/Button";
import LoadingOverlay from "./LoadingOverlay";
import { useAuth } from "@/context/AuthContext";
import useChangeEmail from "../hook/useChangeEmail";
import Modal from "@/common/modal";
import { useRouter } from "next/router";

export default function ChangeEmailSection() {
    const router = useRouter();
    /* ================= styles ================= */

    const styleInput =
        "w-full body2 text-black bg-white border border-gray-400 rounded-lg p-3 placeholder:text-gray-600 focus:outline-none focus:border-orange-500";

    const styleError = "border-purple";
    const styleErrortext = "body3 text-purple";
    const styleLabel = "body2 text-black";

    /* ================= hook ================= */

    const { loading, logout } = useAuth();

    const {
        form,
        errors,
        handleChange,
        submit,
        isLoading,
        success,
        setSuccess
    } = useChangeEmail();

    if (loading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="relative bg-white mx-auto min-h-screen flex flex-col items-center gap-8 px-4 py-10 overflow-hidden lg:pt-[100px] lg:gap-18">

            {/* Header */}
            <h3 className="headline3 text-black">Change Email</h3>

            <section className="z-10 w-full flex flex-col items-center gap-8 lg:w-[500px]">
                {errors.form && (
                    <p className="body3 text-purple text-center">
                        {errors.form}
                    </p>
                )}
                <form onSubmit={submit} className="flex flex-col gap-6 w-full">

                    {/* Current Email */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>Current Email</label>

                        <div className="w-full relative">
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Enter Your Email"
                                className={`${styleInput} ${errors.email ? styleError : ""}`}
                            />
                            {errors.email && (
                                <img
                                    src="/exclamation_circle.svg"
                                    alt="error icon"
                                    className="absolute right-4 top-4"
                                />
                            )}
                        </div>
                        {errors.email && (
                            <p className={styleErrortext}>{errors.email}</p>
                        )}
                    </div>

                    {/* New Email */}
                    <div className="flex flex-col gap-1">

                        <label className={styleLabel}>New Email</label>

                        <div className="w-full relative">

                            <input
                                name="newEmail"
                                type="email"
                                placeholder="Enter new email"
                                value={form.newEmail}
                                onChange={handleChange}
                                className={`${styleInput} ${errors.newEmail ? styleError : ""}`}
                            />

                            {errors.newEmail && (
                                <img
                                    src="/exclamation_circle.svg"
                                    alt="error icon"
                                    className="absolute right-4 top-4"
                                />
                            )}

                        </div>

                        {errors.newEmail && (
                            <p className={styleErrortext}>{errors.newEmail}</p>
                        )}

                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1">

                        <label className={styleLabel}>Password</label>

                        <div className="w-full relative">

                            <input
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                className={`${styleInput} ${errors.password ? styleError : ""}`}
                            />

                            {errors.password && (
                                <img
                                    src="/exclamation_circle.svg"
                                    alt="error icon"
                                    className="absolute right-4 top-4"
                                />
                            )}
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
                        {isLoading ? "Updating..." : "Update Email"}
                    </Button>
                </form>
            </section>
            <Modal
                title="Email Updated"
                open={success}
                onClose={() => setSuccess(false)}
                message="Your email address has been updated successfully. You can continue using your account or log out to sign in with your new email."
                primaryLabel="Continue to Profile"
                secondaryLabel="Log Out"
                onPrimaryClick={() => {
                    setSuccess(false);
                    router.push("/profile");
                }}
                onSecondaryClick={() => {
                    logout();
                    router.push("/login");
                }}
            />
        </div>
    );
}