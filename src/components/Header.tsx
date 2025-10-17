'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { href: '/#categories', label: 'Catégories' },
    { href: '/#candidature', label: 'Candidature' },
    { href: '/#participation', label: 'Participation' },
    { href: '/#calendrier', label: 'Calendrier' },
    { href: '/#partenaires', label: 'Partenaires' }
  ];

  return (
    <header 
      className="w-full relative"
      style={{ backgroundColor: '#10214b' }}
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-center md:justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 md:flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/seeph-logo-nav.svg"
                alt="SEEPH Logo"
                width={180}
                height={40}
                className=" w-auto"
              />
            </Link>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-gray-300 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bouton Toggle Mobile */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="focus:outline-none absolute right-4 md:relative md:right-auto"
              aria-label="Toggle menu"
              style={{ color: '#dbb572' }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Mobile */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 z-50" style={{ backgroundColor: '#10214b' }}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-gray-300 block px-3 py-2 text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
