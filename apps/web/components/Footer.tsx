import Link from 'next/link'
import Image from 'next/image'
import { 
  FaLeaf, 
  FaFacebookF, 
  FaInstagram, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaClock, 
  FaHardHat,
  FaSeedling,
  FaTree,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { MdEco, MdLocalFlorist } from 'react-icons/md'

function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-emerald-700 via-green-800 to-green-900 text-white overflow-hidden">
      {/* Animated floating leaves */}
      <div className="absolute inset-0 pointer-events-none">
        <FaLeaf className="absolute top-10 left-10 text-green-300/20 text-2xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <FaSeedling className="absolute top-20 right-20 text-emerald-300/20 text-xl animate-pulse" style={{ animationDelay: '1s' }} />
        <MdLocalFlorist className="absolute bottom-32 left-1/4 text-green-400/15 text-3xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }} />
        <FaTree className="absolute bottom-20 right-1/3 text-emerald-200/10 text-4xl animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '5s' }} />
      </div>

      {/* Decorative Top Border with Animation */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-300 animate-pulse"></div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:px-6 relative z-10">
        {/* Top Row with Logo and Newsletter */}
        <div className="flex flex-col items-center justify-between gap-8 border-b border-green-600/30 pb-8 lg:flex-row">
          {/* Logo and Tagline */}
          <div className="max-w-sm text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center lg:justify-start group">
              <div className="relative mr-3 size-12 transition-transform group-hover:scale-110 duration-300">
                <Image 
                  src="/assets/logo_Without_Text.png" 
                  alt="Plantomart Logo"
                  fill
                  className="object-contain transition-transform hover:rotate-12 duration-300"
                  priority
                />
              </div>
              <h2 className="bg-gradient-to-r from-emerald-200 to-green-100 bg-clip-text text-4xl font-bold text-transparent font-serif">
                Plantomart
              </h2>
            </div>
            <p className="text-sm text-white leading-relaxed">
              India's premier multi-vendor marketplace connecting plant enthusiasts with trusted green vendors nationwide.
            </p>
            <div className="mt-4 flex items-center justify-center lg:justify-start space-x-2 text-white">
              <MdEco className="text-lg animate-pulse" />
              <span className="text-xs font-medium">Sustainable • Authentic • Trusted</span>
              <FaSeedling className="text-lg animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-700/40 to-green-800/30 p-6 backdrop-blur-sm border border-green-600/20 hover:border-emerald-400/30 transition-all duration-300">
              <div className="flex items-center mb-3">
                <FaLeaf className="text-white mr-2 animate-pulse" />
                <h3 className="text-sm font-semibold text-emerald-100">Stay Rooted with Us</h3>
              </div>
              <div className="flex overflow-hidden rounded-lg shadow-lg">
                <input 
                  type="email" 
                  placeholder="Enter your email for green updates..." 
                  className="flex-1 rounded-l-lg border-y border-l border-green-500/30 bg-green-900/60 px-4 py-3 text-sm placeholder:text-green-400/70 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                />
                <button 
                  type='button' 
                  className="rounded-r-lg bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-emerald-400 hover:to-green-400 hover:shadow-lg transform hover:scale-105 duration-300 flex items-center"
                >
                  <FaSeedling className="mr-1" />
                  Subscribe
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-white">
                🌱 Get exclusive plant deals & expert gardening tips delivered weekly
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Grid Section */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* About Column */}
          <div className="space-y-4">
            <h3 className="mb-4 flex items-center text-lg font-bold text-white font-serif">
              <div className="mr-3 p-2 rounded-full bg-emerald-600/30">
                <FaLeaf className="text-emerald-300 animate-pulse" />
              </div>
              About PlantoMart
            </h3>
            <div className="rounded-xl bg-gradient-to-br from-emerald-800/20 to-green-900/30 p-5 border border-green-600/20 hover:border-emerald-400/30 transition-all duration-300">
              <p className="mb-5 text-md leading-relaxed text-emerald-200/90">
                PlantoMart is India's fastest-growing multi-vendor plant marketplace, connecting passionate plant parents with authentic nurseries and green vendors across the nation. We're cultivating a sustainable future, one plant at a time.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="group flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-700/50 to-green-700/50 transition-all hover:from-emerald-600 hover:to-green-600 hover:shadow-lg transform hover:scale-110 duration-300">
                  <FaFacebookF className="text-emerald-200 group-hover:text-white transition-colors duration-300" />
                </Link>
                <Link href="#" className="group flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-700/50 to-green-700/50 transition-all hover:from-emerald-600 hover:to-green-600 hover:shadow-lg transform hover:scale-110 duration-300">
                  <FaInstagram className="text-emerald-200 group-hover:text-white transition-colors duration-300" />
                </Link>
                <Link href="#" className="group flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-700/50 to-green-700/50 transition-all hover:from-emerald-600 hover:to-green-600 hover:shadow-lg transform hover:scale-110 duration-300">
                  <FaXTwitter className="text-emerald-200 group-hover:text-white transition-colors duration-300" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Support Column */}
          <div className="space-y-4">
            <h3 className="mb-4 flex items-center text-lg font-bold text-white font-serif">
              <div className="mr-3 p-2 rounded-full bg-emerald-600/30">
                <FaHardHat className="text-emerald-300 animate-pulse" />
              </div>
              Plant Care Support
            </h3>
            <div className="rounded-xl bg-gradient-to-br from-emerald-800/20 to-green-900/30 p-5 border border-green-600/20 hover:border-emerald-400/30 transition-all duration-300">
              <div className="flex items-start mb-4">
                <div className="mr-3 rounded-full bg-emerald-700/40 p-2.5">
                  <FaClock className="text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-100 mb-1">Garden Support Hours</h4>
                  <p className="text-xs text-emerald-300/90">Monday – Friday: 8am – 6pm</p>
                  <p className="text-xs text-emerald-300/90">Saturday – Sunday: 9am – 5pm</p>
                  <p className="text-xs text-emerald-400/80 mt-1">🌿 Expert plant advice available!</p>
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-emerald-700/30 to-green-700/30 p-3 text-center">
                <Link href="#" className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-sm font-semibold text-green-950 transition-all hover:from-emerald-400 hover:to-green-400 hover:shadow-lg transform hover:scale-105 duration-300">
                  <FaSeedling className="mr-2" />
                  Get Plant Help
                </Link>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="mb-4 flex items-center text-lg font-bold text-white font-serif">
              <div className="mr-3 p-2 rounded-full bg-emerald-600/30">
                <FaEnvelope className="text-emerald-300 animate-pulse" />
              </div>
              Connect & Grow
            </h3>
            <div className="rounded-xl bg-gradient-to-br from-emerald-800/20 to-green-900/30 p-5 border border-green-600/20 hover:border-emerald-400/30 transition-all duration-300">
              <ul className="space-y-4">
                <li className="flex items-start group">
                  <div className="mr-3 mt-1 rounded-full bg-emerald-700/40 p-2 group-hover:bg-emerald-600/50 transition-colors duration-300">
                    <FaMapMarkerAlt className="text-emerald-300 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">ShowBio Pvt. Ltd.</p>
                    <p className="text-xs text-emerald-200/80">Tolichowki, Hyderabad</p>
                    <p className="text-xs text-emerald-300/70">Telangana - 500008, India</p>
                  </div>
                </li>
                <li className="flex items-center group">
                  <div className="mr-3 rounded-full bg-emerald-700/40 p-2 group-hover:bg-emerald-600/50 transition-colors duration-300">
                    <FaPhoneAlt className="text-emerald-300 text-sm" />
                  </div>
                  <Link href="tel:+918331801000" className="text-sm text-emerald-200 hover:text-white transition-colors duration-300">
                    +91 833 180 1000
                  </Link>
                </li>
                <li className="flex items-center group">
                  <div className="mr-3 rounded-full bg-emerald-700/40 p-2 group-hover:bg-emerald-600/50 transition-colors duration-300">
                    <FaEnvelope className="text-emerald-300 text-sm" />
                  </div>
                  <Link href="mailto:hello@plantomart.com" className="text-sm text-emerald-200 hover:text-white transition-colors duration-300">
                    hello@plantomart.com
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-green-950 to-emerald-950 py-6 relative">
        {/* Subtle plant decorations */}
        <div className="absolute inset-0 opacity-5">
          <FaLeaf className="absolute top-2 left-10 text-2xl animate-pulse" />
          <FaSeedling className="absolute top-2 right-10 text-xl animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Payment Methods */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3 border-b border-emerald-800/30 pb-4">
            <div className="flex items-center">
              <FaLeaf className="text-emerald-400 mr-2 animate-pulse" />
              <span className="text-sm text-emerald-300 font-medium">Secure & Trusted Payments:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { name: 'Visa', icon: '💳' },
                { name: 'Mastercard', icon: '💳' },
                { name: 'UPI', icon: '📱' },
                { name: 'Razorpay', icon: '⚡' }
              ].map((method) => (
                <div 
                  key={method.name} 
                  className="rounded-lg bg-gradient-to-r from-emerald-900/60 to-green-900/60 px-3 py-1.5 text-xs text-emerald-200 hover:from-emerald-800/60 hover:to-green-800/60 transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <span className="mr-1">{method.icon}</span>
                  {method.name}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer Legal & Links */}
          <div className="flex flex-col items-center justify-between gap-4 text-center lg:flex-row lg:text-left">
            <div className="flex items-center">
              <FaSeedling className="text-emerald-400 mr-2 animate-pulse" />
              <p className="text-sm text-emerald-300">
                © {new Date().getFullYear()} PlantoMart. Growing green dreams across India.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {['Privacy Policy', 'Terms of Service', 'Shipping Info', 'Return Policy', 'Plant Care Guide'].map((link) => (
                <Link 
                  key={link}
                  href="#" 
                  className="text-sm text-emerald-400/80 transition-colors hover:text-emerald-200 hover:underline duration-300"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Developer Attribution */}
          <div className="mt-4 text-center border-t border-emerald-800/20 pt-4 font-[Inter] text-emerald-100/80">
            <p className="text-md">
              Developed by{' '}
              <Link 
                href="https://adnanthecoder.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-300 hover:text-emerald-100 transition-colors duration-300 underline decoration-emerald-400/50 hover:decoration-emerald-200 font-[EB_Garamond]"
              >
                Adnan
              </Link>
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}

export default Footer