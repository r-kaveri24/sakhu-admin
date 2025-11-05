"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

import header1 from "@/assets/header1.png";
import header2 from "@/assets/header2.png";
import header3 from "@/assets/header3.png";



type HeaderProps = {
  title?: string;
  onLogout?: () => void;
};

export default function Header({ title = "SAKHU Admin", onLogout }: HeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();
  
  const handleLogout = () => {
    if (onLogout) return onLogout();
    logout();
  };
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-4 md:px-6">
      <div className="text-sm md:text-base font-semibold text-[#E4117F]">{title}</div>
      <div className="flex items-center gap-3">
        <button aria-label="Profile" className="h-8 w-8 rounded-full  flex items-center justify-center cursor-pointer">
         <Image src={header1} alt="Profile" width={28} height={28} />
        </button>
        <button aria-label="Info" className="h-8 w-8 rounded-full  flex items-center justify-center cursor-pointer">
          <Image src={header2} alt="Info" width={28} height={28} /> 
        </button>
        <button aria-label="Logout" onClick={handleLogout} className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer" >
          <Image src={header3} alt="Logout" width={28} height={28} />
        </button>
      </div>
    </header>
  );
}