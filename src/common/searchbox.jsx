import React from 'react';
import { Search } from 'lucide-react';
import { cn } from "../lib/utils"; 

const SearchBox = ({ value, onChange, placeholder = "Search...", className }) => {
  return (
    <div    
      className={cn(
        
        "relative flex items-center bg-[#FFFFFF] border border-[#CCD0D7] rounded-[8px] opacity-100",
        "w-[343px] h-[48px] gap-[10px] px-[16px] py-[12px]",
   
        "lg:w-[357px]",
        className
      )}
    >
      <Search className="w-[20px] h-[20px] text-[#9AA1B9]" />
     
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full h-full outline-none bg-transparent",
          "font-['Inter'] font-[400] text-[16px] leading-[150%] placeholder:text-[#9AA1B9] text-gray-700",
          "align-middle"
        )}
      />
    </div>
  );
};

export default SearchBox;