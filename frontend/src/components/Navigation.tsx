import { NavLink } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export default function Navigation() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/decks', icon: BookOpen, label: 'Decks' },
    { to: '/study', icon: Plus, label: 'Study' },
    { to: '/stats', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'tap-target flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
