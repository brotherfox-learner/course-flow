import Button from "./Button"
import BrandLogo from "./BrandLogo"
function NavBar() {
    return (
        <nav className="sticky top-0 z-100 shadow-2 flex flex-row items-center justify-between bg-white px-4 py-3 lg:px-30">
            <BrandLogo />
            <div className="space-x-2 lg:space-x-12">
                <Button variant="ghost" size="ghost" className="text-dark-blue-500!">Our Courses</Button>
                <Button variant="primary" size="md">Log in</Button>
            </div>
        </nav>
    )
}

export default NavBar