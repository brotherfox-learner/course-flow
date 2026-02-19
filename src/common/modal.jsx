"use client";

import { X } from "lucide-react";
import Button from "./navbar/Button";

export default function Modal({
  open,
  onClose,
  title = "Confirmation",
  message,
  children,
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
}) {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const content = children ?? message;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {/* Container หลัก: ขยายขนาดตามเนื้อหาในจอใหญ่ */}
      <section
        className="relative w-full max-w-[343px] min-h-[304px] lg:max-w-[520px] lg:min-h-fit rounded-[16px] bg-white shadow-[2px_2px_12px_0px_rgba(64,50,133,0.12)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header: คงที่ 56px */}
        <header className="flex w-full h-[56px] items-center justify-between border-b border-gray-200 py-[8px] px-[16px]">
          <div 
            id="modal-title" 
            className="text-[20px] font-normal leading-[150%] text-gray-900 w-[270px] lg:w-full h-[30px]"
          >
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

       
        <div className="flex flex-col w-full min-h-[248px] lg:min-h-fit lg:min-w-fit p-[24px_16px] gap-[10px]">
          
       
          <div 
            className="w-full text-[16px] font-normal leading-[150%] text-gray-700"
          >
            {content}
          </div>

       
          <footer className="flex flex-col lg:flex-row w-full gap-[16px] lg:justify-start lg:pt-4 mt-[20px] lg:mt-[-5px]">
            {secondaryLabel != null && (
              <Button
                variant="secondary"
                className="w-full lg:w-auto h-[56px] rounded-[12px] border py-[16px] px-[32px] gap-[10px] order-1 lg:order-1 "
                onClick={() => {
                  onSecondaryClick?.();
                  onClose?.();
                }}
              >
                {secondaryLabel}
              </Button>
            )}
            {primaryLabel != null && (
              <Button
                variant="primary"
                className="w-full lg:w-auto h-[56px] rounded-[12px] border py-[16px] px-[32px] gap-[10px] order-2 lg:order-2"
                onClick={() => {
                  onPrimaryClick?.();
                  onClose?.();
                }}
              >
                {primaryLabel}
              </Button>
            )}
          </footer>
        </div>
      </section>
    </div>
  );
}