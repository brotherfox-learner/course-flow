function LoadingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="flex flex-row items-baseline gap-4">
                <p className="text-white headline2">Loading</p>
                <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-3 h-3 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-3 h-3 rounded-full bg-blue-300 animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    )
}

export default LoadingOverlay