import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children, footerText, footerLink, footerLinkText }) => {
  return (
    <div className="min-h-screen bg-[#F0FFF4] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-6xl rounded-3xl overflow-hidden flex shadow-sm">

        <div className="w-full md:w-1/2 p-8 lg:p-12">
          <Link to="/" className="font-bold mb-6 block">logo</Link>
          <h1 className="text-3xl font-bold mb-6">{title}</h1>

          {children}

          <p className="mt-6 text-center text-sm text-gray-500">
            {footerText}{' '}
            <Link to={footerLink} className="text-blue-600 font-semibold hover:underline">
              {footerLinkText}
            </Link>
          </p>
        </div>

        <div className="hidden md:block w-1/2 p-6">
          <div className="h-full w-full rounded-[2.5rem] bg-gray-100 flex items-center justify-center">
            image
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
