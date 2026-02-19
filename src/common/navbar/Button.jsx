// default setting button variant = "primary" size = "lg"
// รับ className เพิ่มได้
// รับ props จากภายนอกเช่น Onclick disabled


function Button({
    children,
    variant = "primary",
    size = "lg",
    className = "",
    ...props
}) {
    const baseBehavior =
        "inline-flex items-center justify-center font-bold rounded-xl cursor-pointer transition-colors duration-200 disabled:cursor-not-allowed";

    const sizes = {
        sm: "text-xs p-[8px]",
        md: "text-sm px-[16px] py-[8px] lg:text-base lg:px-[32px] lg:py-[18px]",
        lg: "text-base px-[32px] py-[18px]",
        ghost: "text-sm lg:text-base px-[8px] py-[4px]"
    };

    const variants = {
        primary: `
        ${baseBehavior}
        shadow-1
        text-white bg-blue-500
        hover:bg-blue-400
        active:bg-blue-700
        disabled:bg-gray-400
        disabled:text-gray-600
      `,
        secondary: `
        ${baseBehavior}
        shadow-1
        text-orange-500 border border-orange-500 bg-white
        hover:border-orange-100 hover:text-orange-100
        active:bg-gray-100
        disabled:border-gray-400
        disabled:text-gray-400
      `,
        ghost: `
        ${baseBehavior}
        text-blue-500
        hover:text-blue-400
        active:text-blue-600
        disabled:text-gray-500
      `,
    };

    const currentVariant = variants[variant] || variants.primary;

    return (
        <button
            className={`${currentVariant} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;