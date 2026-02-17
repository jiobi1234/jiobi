export default function Footer() {
  return (
    <footer className="bg-[#2b2d25] text-white py-8">
      <div className="max-w-full mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="text-left">
            <h3 className="text-xl font-bold mb-2 text-left">jiobi</h3>
            <p className="text-sm opacity-75 text-left">문의 이메일 : maaaruuu7407@gmail.com</p>
          </div>
          <div className="mt-4 md:mt-0 text-sm opacity-75 text-right">
            <p>© 2025 Jiobi.kr. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

