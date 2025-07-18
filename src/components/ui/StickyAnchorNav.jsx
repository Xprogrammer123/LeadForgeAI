import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const StickyAnchorNav = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: "How It Works", href: "#how-it-works", section: "solution" },
    { label: "Pricing", href: "#pricing", section: "pricing" },
    { label: "Proof", href: "#proof", section: "social-proof" },
    { label: "FAQ", href: "#faq", section: "faq" },
    { label: "Get Access", href: "#get-access", section: "conversion" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > heroHeight);

      // Update active section based on scroll position
      const sections = navigationItems.map(item => item.href.substring(1));
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!isVisible) return null;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-100 transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="glassmorphism">
          <div className="max-w-container mx-auto px-5 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Icon name="Zap" size={20} color="var(--color-primary-foreground)" />
                  </div>
                  <span className="font-headline-bold text-xl text-foreground">
                    AgenticAI SDR
                  </span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {navigationItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`font-body-medium text-sm transition-colors duration-200 hover:text-primary ${
                      activeSection === item.href.substring(1)
                        ? 'text-primary' :'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                <Icon 
                  name={isMobileMenuOpen ? "X" : "Menu"} 
                  size={24} 
                  color="var(--color-foreground)" 
                />
              </button>
            </div>
          </div>

          {/* Scroll Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface">
            <div 
              className="h-full bg-primary transition-all duration-100 ease-out"
              style={{
                width: `${Math.min(100, (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%`
              }}
            />
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-200 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 w-80 h-full glassmorphism animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <span className="font-headline-bold text-lg text-foreground">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
                >
                  <Icon name="X" size={24} color="var(--color-foreground)" />
                </button>
              </div>
              
              <nav className="space-y-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`block w-full text-left p-3 rounded-lg font-body-medium transition-all duration-200 ${
                      activeSection === item.href.substring(1)
                        ? 'bg-primary/10 text-primary border border-primary/20' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyAnchorNav;