import Button from "@/common/navbar/Button";
import DatePickerInput from "@/features/register/components/DatePicker";
import { ComboBox } from "@/features/register/components/ComboBox";
import useProfile from "../hook/useProfile";
import LoadingOverlay from "./LoadingOverlay";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
    /* ================= styles ================= */
    const styleInput =
        "w-full body2 text-black bg-white border border-gray-400 rounded-lg p-3 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"

    const styleError = "border-purple"
    const styleErrortext = "body3 text-purple"
    const styleLabel = "body2 text-black"

    /* ================= hook ================= */
    const {
        form,
        imageUrl,
        errors,
        isLoading,
        handleChange,
        handleImageChange,
        handleRemovePhoto,
        submit,
    } = useProfile();
    const { loading } = useAuth()

    if (loading) {
        return (<LoadingOverlay/>)
    }

    return (
        <div className="relative bg-white mx-auto min-h-screen flex flex-col items-center gap-8 px-4 py-10 overflow-hidden lg:pt-[100px] lg:gap-18">
            {/* ================= Decorative Assets ================= */}
            <div className="absolute w-full h-[245px] lg:h-[190px]">
                <div className="absolute left-5 top-0 h-[11px] w-[11px] rounded-full border-[3px] border-[#2F5FAC] lg:left-[100px]" />
                <div className="absolute left-[-14px] top-[27px] h-[27px] w-[27px] rounded-full bg-[#C6DCFF] lg:left-[43px] lg:top-[48px]" />
                <div className="absolute right-[-15px] bottom-0 h-[74px] w-[74px] rounded-full bg-[#C6DCFF]" />
                <img
                    src="orange_polygon.svg"
                    alt="orange polygon"
                    className="absolute right-[-5px] top-[30px] lg:right-[126px]"
                />
            </div>

            {/* ================= Header ================= */}
            <h3 className="headline3 text-black">Profile</h3>

            {/* ================= Content ================= */}
            <section className="z-10 w-full flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:w-[930px] lg:gap-30">
                {/* ================= Profile Image ================= */}
                <div className="flex flex-col gap-4">
                    <div className="w-[343px] h-[343px] lg:w-[358px] lg:h-[358px] rounded-2xl overflow-hidden">
                        <img
                            src={imageUrl || "profile_dummie.svg"}
                            alt="profile"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <label
                            htmlFor="upload"
                            className="inline-flex items-center justify-center font-bold rounded-xl cursor-pointer transition-colors duration-200 text-base px-[32px] py-[18px] shadow-1 text-white bg-blue-500 hover:bg-blue-400 active:bg-blue-700"
                        >
                            Change photo
                        </label>

                        <input
                            id="upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />

                        <Button variant="ghost" size="ghost" onClick={handleRemovePhoto}>
                            Remove photo
                        </Button>
                    </div>
                </div>

                {/* ================= Form ================= */}
                <form
                    onSubmit={submit}
                    className="flex flex-col gap-6 w-full lg:gap-10"
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
                            inputClassName={styleInput}
                            placeholder="Select educational background (optional)"
                        />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            disabled
                            className="w-full body2 text-black/40 bg-gray-200 border border-gray-400 rounded-lg p-3"
                        />
                    </div>

                    {/* Submit */}
                    <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Profile"}
                    </Button>
                </form>
            </section>
        </div>
    );
}