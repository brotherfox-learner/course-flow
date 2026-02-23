import PaymentForm from "../../features/payment/PaymentForm";


export default function PaymentPage() {
  return (
    <div className="min-h-screen mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 pt-12 lg:pt-16 flex flex-col items-center justify-center text-6xl">
      This is the payment page
      <div>
      <a className="bg-blue-500 text-white px-4 py-2 rounded-md text-blue-500 body2 font-medium hover:underline" href="/payment/1">Payment Page 1</a>
      </div>
      <div>
      <a className="bg-blue-500 text-white px-4 py-2 rounded-md text-blue-500 body2 font-medium hover:underline" href="/payment/2">Payment Page 2</a>
      </div>
      <div>
      <a className="bg-blue-500 text-white px-4 py-2 rounded-md text-blue-500 body2 font-medium hover:underline" href="/payment/3">Payment Page 3</a>
      </div>
      <div>
      <a className="bg-blue-500 text-white px-4 py-2 rounded-md text-blue-500 body2 font-medium hover:underline" href="/payment/4">Payment Page 4</a>
      </div>
    </div>
  );
}