import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-16 border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h1>icon</h1>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Dedicated to providing compassionate care and comfort for your loved ones. We create valued and comfortable living families space of shared community, respect and love.
            </p>
            <div className="flex gap-4"></div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/" className="hover:text-green-600">Home</Link></li>
              <li><Link to="/about" className="hover:text-green-600">About</Link></li>
              <li><Link to="/services" className="hover:text-green-600">Services</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-green-600">Terms of Service</a></li>
              <li><a href="#" className="hover:text-green-600">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
