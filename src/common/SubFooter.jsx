import Button from "./navbar/Button"
function SubFooter() {
    return (
        <div className="flex flex-col gap-[24px] py-16 px-4 subfooter-bg min-h-[53vh]">
            <div className="flex flex-col items-center gap-[24px]">
                <h3 className="text-[24px] font-medium text-white">Want to start learning?</h3>
                <Button variant="secondary" size="lg">Register here</Button>
            </div>
            <div className="relative h-[280px]">
                <img
                    src="/learning.svg"
                    alt="learning"
                    className="absolute top-2"
                />
                <img
                    src="/white_polygon.svg"
                    alt="white-polygon"
                    className="absolute bottom-0"
                />
                <img
                    src="/not-start.svg"
                    alt="green-circle"
                    className="absolute bottom-0"
                />
            </div>
        </div>
    )
}

export default SubFooter