import React, { useState } from 'react';
import { Monitor, ShoppingCart, BookOpen, MessageSquare, Cpu, User, LogOut, LayoutDashboard, Hammer, Box, Sparkles, Package } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
}

export default function Navbar({ activeTab, setActiveTab, cartCount }: NavbarProps) {
  const { user, profile, setAuthModalOpen, signOut } = useAuth();

  const isAdminOrOwner = profile?.role === 'admin' || profile?.role === 'owner';

  const navItems = [
    { id: 'home', label: 'Home', icon: Monitor },
    { id: 'shop', label: 'Shop', icon: ShoppingCart },
  ];

  if (user && !isAdminOrOwner) {
    navItems.push({ id: 'my-builds', label: 'My Builds', icon: Box });
    navItems.push({ id: 'my-orders', label: 'My Orders', icon: Package });
  }

  if (!isAdminOrOwner) {
    navItems.push({ id: 'builder', label: 'PC Builder', icon: Hammer });
  }

  navItems.push(
    { id: 'tutorial', label: 'Video Guides', icon: BookOpen },
    { id: 'support', label: 'AI Support', icon: Sparkles }
  );

  if (isAdminOrOwner) {
    navItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div 
          className="flex cursor-pointer items-center gap-2" 
          onClick={() => setActiveTab('home')}
        >
          <Cpu className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold tracking-tighter text-white">PC MASTER</span>
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400",
                activeTab === item.id ? "text-emerald-500" : "text-zinc-400"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.id === 'shop' && !isAdminOrOwner && cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  {profile?.role === 'owner' && <span className="text-[8px] bg-purple-500/20 text-purple-500 px-1.5 py-0.5 rounded-full font-bold uppercase">Owner</span>}
                  {profile?.role === 'admin' && <span className="text-[8px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full font-bold uppercase">Admin</span>}
                  <span className="text-xs font-bold text-white leading-none">{profile?.displayName || user.displayName || 'User'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-500 leading-none">{user.email}</span>
                  {!isAdminOrOwner && (
                    <button 
                      onClick={() => setActiveTab('my-builds')}
                      className="text-[9px] text-emerald-500 hover:underline font-bold uppercase tracking-wider"
                    >
                      My Builds
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setAuthModalOpen(true, 'login')}
                className="text-xs sm:text-sm font-bold text-zinc-400 hover:text-white transition-colors px-2 py-1"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthModalOpen(true, 'signup')}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-bold text-black hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button (Simplified) */}
        {!isAdminOrOwner && (
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setActiveTab('shop')}
              className="relative text-zinc-400"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
