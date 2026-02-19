function FeatureSection() {
    const features = [
        {
            image: "/laptop_1.svg",
            title: "Learning experience has been enhanced with new technologies",
            items: [
                {
                    icon: "/shield.svg",
                    title: "Secure & Easy",
                    description:
                        "Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.",
                },
                {
                    icon: "/heart.svg",
                    title: "Supports All Students",
                    description:
                        "Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.",
                },
            ],
        },
        {
            image: "/laptop_2.svg",
            title: "Interactions between the tutor and the learners",
            items: [
                {
                    icon: "/group.svg",
                    title: "Purely Collaborative",
                    description:
                        "Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.",
                },
                {
                    icon: "/heart.svg",
                    title: "Supports All Students",
                    description:
                        "Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.",
                },
            ],
        },
    ];
    return (
        <div className="relative px-4 py-16 bg-white lg:px-[160px] lg:py-[160px]">
            <div className="relative z-10 space-y-16 lg:space-y-30">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`flex flex-col gap-8 lg:gap-30 ${index % 2 === 1
                                ? "lg:flex-row-reverse"
                                : "lg:flex-row"
                            }`}
                    >
                        <img
                            src={feature.image}
                            alt="Laptop"
                            className="object-cover rounded-xl grow"
                        />

                        <div className="space-y-8 lg:w-[547px]">
                            <h3 className="headline3 text-black lg:headline2">
                                {feature.title}
                            </h3>

                            <div className="space-y-6">
                                {feature.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-row items-start gap-4"
                                    >
                                        <img src={item.icon} alt="" />
                                        <div className="space-y-[10px]">
                                            <p className="body1 text-black lg:headline3">
                                                {item.title}
                                            </p>
                                            <p className="body3 text-gray-700 lg:body2">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute top-[-20px] w-12 h-12 rounded-full circle-gradient rotate-300 lg:w-[73px] lg:h-[73px]"></div>
            <div className="absolute top-11 right-10 w-8 h-8 rounded-full bg-blue-100 lg:left-[500px] lg:top-24"></div>
            <div className="absolute top-[680px] z-100 right-10 text-[#9B2FAC] text-5xl rotate-20 lg:top-[380px]">+</div>
            <div className="absolute bottom-0 right-7 w-12 h-12 rounded-full bg-[#C6DCFF] lg:w-[85px] lg:h-[85px] lg:bottom-[-45px] lg:right-30"></div>
        </div>
    )
}

export default FeatureSection;