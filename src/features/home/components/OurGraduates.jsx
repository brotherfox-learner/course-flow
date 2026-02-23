function OurGraduates() {
    const comments = [
        {
            id: 1,
            name: "Saiful Islam",
            image: "/saiful_islam.png",
            comment: `Start with something simple and small, then expand over time.
            If people call it a ‘toy’ you’re definitely onto something.
            If you’re waiting for encouragement from others, you’re doing it wrong.
            By the time people think an idea is good, it’s probably too late.`,
        },
        {
            id: 2,
            name: "Ethan Walker",
            image: "/ethan_walker.png",
            comment: `Start with something simple and small, then expand over time.
            If people call it a ‘toy’ you’re definitely onto something.
            If you’re waiting for encouragement from others, you’re doing it wrong.
            By the time people think an idea is good, it’s probably too late.`,
        },
        {
            id: 3,
            name: "Lucas Bennett",
            image: "/lucas_bennett.png",
            comment: `Start with something simple and small, then expand over time.
            If people call it a ‘toy’ you’re definitely onto something.
            If you’re waiting for encouragement from others, you’re doing it wrong.
            By the time people think an idea is good, it’s probably too late.`,
        },
    ];

    return (
        <div className="relative flex flex-col items-center gap-8 lg:gap-15 space-y-8 bg-white pt-6 pb-12 lg:pt-[109px] lg:pb-[217px] overflow-hidden">
            <h3 className="headline3 text-black lg:headline2">Our Graduates</h3>
            <div className="coarousel-container">
                <div className="coarousel-track flex w-max animate-scroll">
                    {comments.map((item) => (
                        <div
                            key={`a-${item.id}`}
                            className="
                            relative flex flex-col items-center
                            w-[312px] h-[582px]
                            lg:w-[738px] lg:h-[311px] lg:flex-row
                            mr-0 lg:mr-[80px]
                            "
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className="
                                w-[248px] h-[298px]
                                object-cover rounded-xl
                                z-10
                                lg:w-[200px] lg:h-[240px] lg:left-0
                                "
                            />

                            <div
                                className="
                                flex flex-col gap-[14px]
                                px-6 pb-10 pt-[288px]
                                max-w-[296px]
                                bg-blue-100 rounded-lg
                                absolute top-6 z-0
                                lg:max-w-[579px]
                                lg:py-[67px] lg:pl-[72px] lg:pr-[25px]
                                lg:right-1 lg:top-auto
                                "
                            >
                                <p className="body1 text-blue-500 lg:headline3">
                                    {item.name}
                                </p>

                                <p className="body3 text-gray-700 lg:body2 whitespace-pre-line">
                                    {item.comment}
                                </p>
                            </div>

                            <img
                                src="/quotemarks-left.svg"
                                alt="quote marks open"
                                className="
                                w-[49px] h-[34px]
                                absolute top-[-8px] left-15
                                z-50
                                lg:w-[81px] lg:h-[57px] lg:left-0 lg:top-0
                                "
                            />

                            <img
                                src="/quotemarks-right.svg"
                                alt="quote marks close"
                                className="
                                w-[40px] h-[29px]
                                absolute bottom-10 right-5
                                lg:w-[52px] lg:h-[37px] lg:bottom-4
                                "
                            />
                        </div>
                    ))}
                    {comments.map((item) => (
                        <div
                            key={`b-${item.id}`}
                            className="
                            relative flex flex-col items-center
                            w-[312px] h-[582px]
                            lg:w-[738px] lg:h-[311px] lg:flex-row
                            mr-0 lg:mr-[80px]
                            "
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className="
                                w-[248px] h-[298px]
                                object-cover rounded-xl
                                z-10
                                lg:w-[200px] lg:h-[240px] lg:left-0
                                "
                            />

                            <div
                                className="
                                flex flex-col gap-[14px]
                                px-6 pb-10 pt-[288px]
                                max-w-[296px]
                                bg-blue-100 rounded-lg
                                absolute top-6 z-0
                                lg:max-w-[579px]
                                lg:py-[67px] lg:pl-[72px] lg:pr-[25px]
                                lg:right-1 lg:top-auto
                                "
                            >
                                <p className="body1 text-blue-500 lg:headline3">
                                    {item.name}
                                </p>

                                <p className="body3 text-gray-700 lg:body2 whitespace-pre-line">
                                    {item.comment}
                                </p>
                            </div>

                            <img
                                src="/quotemarks-left.svg"
                                alt="quote marks open"
                                className="
                                w-[49px] h-[34px]
                                absolute top-[-8px] left-15
                                z-50
                                lg:w-[81px] lg:h-[57px] lg:left-0 lg:top-0
                                "
                            />

                            <img
                                src="/quotemarks-right.svg"
                                alt="quote marks close"
                                className="
                                w-[40px] h-[29px]
                                absolute bottom-10 right-5
                                lg:w-[52px] lg:h-[37px] lg:bottom-4
                                "
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute right-[-10px] rotate-340 w-8 h-8 rounded-full circle-gradient lg:rotate-330 lg:top-1 lg:right-[-30px] lg:w-[73px] lg:h-[73px]"></div>
            <div className="absolute right-8 top-13 w-3 h-3 rounded-full bg-blue-100 lg:top-21 lg:right-20"></div>
            <img src="/green_cross.svg" alt="green cross" className="w-[14px] h-[14px] absolute left-7 bottom-5 lg:bottom-[114px] lg:left-23" />
        </div>
    )
}

export default OurGraduates