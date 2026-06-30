import { NavLink } from 'react-router-dom';
import { LayoutGrid, BarChart3, UtensilsCrossed, Store } from 'lucide-react';

const navItems = [
  {
    to: '/orders',
    label: 'ORDERS',
    icon: LayoutGrid
  },
  {
    to: '/stats',
    label: 'STATS',
    icon: BarChart3
  },
  {
    to: '/menu-manage',
    label: 'MENU',
    icon: UtensilsCrossed
  },
  {
    to: '/profile',
    label: 'PROFILE',
    icon: Store
  }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={24} strokeWidth={2} />
            <span className="mt-1">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
