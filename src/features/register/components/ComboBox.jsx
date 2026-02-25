import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"

const educationals = [
    "Engineering",
    "Medicine",
    "Nursing",
    "Pharmacy",
    "Computer Science",
    "Information Technology",
    "Data Science",
    "Artificial Intelligence",
    "Business Administration",
    "Marketing",
    "Finance",
    "Accounting",
    "Economics",
    "Science",
    "Mathematics",
    "Architecture",
    "Design",
    "Education",
    "Law",
    "Other"
]


export function ComboBox({ name, value, onChange, className, inputClassName, placeholder }) {
    const handleSelect = (selectedValue) => {
        // จำลอง event object แบบเดียวกับ input onChange
        onChange({
            target: {
                name,
                value: selectedValue,
            },
        })
    }

    return (
        <Combobox items={educationals} value={value} onValueChange={handleSelect}>
            <ComboboxInput
                placeholder={placeholder ?? ""}
                className={className}
                inputClassName={inputClassName}
            />
            <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}

