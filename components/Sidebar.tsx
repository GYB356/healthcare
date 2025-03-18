'use client';

import { User } from '@/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  roles: User['role'][];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['patient', 'doctor', 'nurse', 'staff', 'administrator'] },
  { name: 'Appointments', href: '/appointments', icon: CalendarIcon, roles: ['patient', 'doctor', 'nurse', 'staff', 'administrator'] },
  { name: 'Medical Records', href: '/medical-records', icon: DocumentTextIcon, roles: ['patient', 'doctor', 'nurse', 'administrator'] },
  { name: 'Billing', href: '/billing', icon: CreditCardIcon, roles: ['patient', 'staff', 'administrator'] },
  { name: 'Staff Schedule', href: '/staff-schedule', icon: ClipboardDocumentListIcon, roles: ['staff', 'administrator'] },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['administrator'] },
  { name: 'Messaging', href: '/messaging', icon: ChatBubbleLeftRightIcon, roles: ['patient', 'doctor', 'nurse', 'staff', 'administrator'] },
  { name: 'Device Integration', href: '/devices', icon: DevicePhoneMobileIcon, roles: ['doctor', 'nurse', 'administrator'] },
  { name: 'Patient Management', href: '/patients', icon: UserGroupIcon, roles: ['doctor', 'nurse', 'administrator'] },
  { name: 'Profile', href: '/profile', icon: UserIcon, roles: ['patient', 'doctor', 'nurse', 'staff', 'administrator'] },
];

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-sm">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-6 w-6 ${
                    isActive
                      ? 'text-blue-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
