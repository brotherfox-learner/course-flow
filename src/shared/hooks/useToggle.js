import { useState } from "react";

export function useToggle() {
    const [isShow,setIsShow] = useState(false)
    const switchToggle = () => setIsShow((prev) => !prev)
    const reset = () => setIsShow(false);

    return {isShow, switchToggle, reset}
}