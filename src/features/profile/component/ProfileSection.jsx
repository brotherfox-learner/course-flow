import Button from "@/common/navbar/Button";
import DatePickerInput from "@/features/register/components/DatePicker"
import useProfile from "../hook/useProfile";

export default function ProfilePage() {
    const styleInput = "w-full body2 text-black bg-white border border-gray-400 rounded-lg p-3 placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
    const styleError = "border-purple"
    const styleErrortext = "body3 text-purple"
    const styleLabel = "body2 text-black"
    const {
        form,
        imageUrl,
        errors,
        isLoading,
        handleChange,
        handleImageChange,
        handleRemovePhoto,
        submit,
    } = useProfile()

    return (
        <div className="relative bg-white mx-auto min-h-screen flex flex-col items-center gap-8 px-4 py-10 overflow-hidden lg:pt-[100px] lg:gap-18">
            {/* ===== Decorative Assets ===== */}
            <div className="absolute w-full h-[245px] lg:h-[190px]">
                {/* Ellipse small */}
                <div className="absolute left-5 top-0 h-[11px] w-[11px] rounded-full border-[3px] border-[#2F5FAC] lg:left-[100px]" />

                {/* Ellipse meduim */}
                <div className="absolute left-[-14px] top-[27px] h-[27px] w-[27px] rounded-full bg-[#C6DCFF] lg:left-[43px] lg:top-[48px]" />

                {/* Ellipse large */}
                <div className="absolute right-[-15px] bottom-0 h-[74px] w-[74px] rounded-full bg-[#C6DCFF]" />

                {/* Polygon 3 */}
                <img className="absolute right-[-5px] top-[30px] lg:right-[126px]" src="orange_polygon.svg" alt="orange polygon" />
            </div>

            {/* ===== Header ===== */}
            <h3 className="headline3 text-black">
                Profile
            </h3>
            {/* ===== Detail ===== */}
            <section className="z-10 w-full flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:w-[930px] lg:gap-30">
                {/* ===== Profile Picture ===== */}
                <div className="flex flex-col gap-4">
                    <div className="w-[343px] h-[343px] lg:w-[358px] lg:h-[358px] rounded-2xl overflow-hidden">
                        <img src={imageUrl || "profile_dummie.svg"} className="w-full h-full object-cover" />
                    </div>

                    {/* action */}
                    <div className="flex flex-col items-center gap-4">
                        <label
                            htmlFor="upload"
                            className="inline-flex items-center justify-center font-bold rounded-xl cursor-pointer transition-colors duration-200 disabled:cursor-not-allowed outline-none focus-visible:border-2 focus-visible:border-black text-base px-[32px] py-[18px]         shadow-1
        text-white bg-blue-500
        hover:bg-blue-400
        active:bg-blue-700
        disabled:bg-gray-400
        disabled:text-gray-600"
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

                {/* ===== Form ===== */}
                <form onSubmit={submit} className="flex flex-col gap-6 w-full lg:gap-10">
                    {/* ===== First Name ===== */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>First Name</label>
                        <div className="relative w-full">
                            <input
                                name="firstName"
                                type="text"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="Enter your first name"
                                className={styleInput}
                            />
                        </div>
                    </div>

                    {/* ===== Last Name ===== */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>Last Name</label>
                        <div className="relative w-full">
                            <input
                                name="lastName"
                                type="text"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Enter your last name"
                                className={styleInput}
                            />
                        </div>
                    </div>

                    {/* ===== Date of Birth ===== */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>Date of Birth</label>
                        <div className="relative w-full">
                            <DatePickerInput
                                value={form.birthDate}
                                onChange={handleChange}
                                name="birthDate"
                                className={styleInput}
                            />
                        </div>
                    </div>

                    {/* ===== Educational Background ===== */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>Educational Background</label>
                        <div className="relative w-full">
                            <input
                                name="educationalBackground"
                                type="text"
                                value={form.educationalBackground}
                                onChange={handleChange}
                                placeholder="Enter educational background"
                                className={styleInput}
                            />
                        </div>
                    </div>

                    {/* ===== Email ===== */}
                    <div className="flex flex-col gap-1">
                        <label className={styleLabel}>Email</label>
                        <div className="relative w-full">
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                disabled
                                placeholder="Enter your email"
                                className="w-full body2 text-black/40 bg-gray-200 border border-gray-400 rounded-lg p-3"
                            />
                        </div>
                    </div>

                    {/* ===== Submit ===== */}
                    <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Profile"}
                    </Button>
                </form>
            </section>
        </div>
    );
}