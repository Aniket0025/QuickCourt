import { Link } from 'react-router-dom';
import { Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/50 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand + Address */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img
                src={logoUrl}
                alt="QuickCourt Logo"
                className="h-8 w-8 rounded-lg object-cover"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold text-gradient-brand">QuickCourt</span>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">Address</div>
                  <div>401 & 402, Floor 4, IT Tower 3 InfoCity Gate, 1, Gandhinagar, Gujarat 382007</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Get in Touch */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground tracking-wide">Get in Touch</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:aniketyadav25012005@gmail.com" className="hover:text-foreground">aniketyadav25012005@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:chaitanyauthale5@gmail.com" className="hover:text-foreground">chaitanyauthale5@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:yasinshaikh2186@gmail.com" className="hover:text-foreground">yasinshaikh2186@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:shreyapatil9921@gmail.com" className="hover:text-foreground">shreyapatil9921@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Learn More */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground tracking-wide">Learn More</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link to="/" className="hover:text-foreground">Case Studies</Link></li>
              <li><Link to="/blogs" className="hover:text-foreground">Blog</Link></li>
              <li><Link to="/" className="hover:text-foreground">Resources</Link></li>
              <li><Link to="/" className="hover:text-foreground">Testimonials</Link></li>
              <li><Link to="/" className="hover:text-foreground">Cookie Policy (EU)</Link></li>
            </ul>
          </div>

          {/* App Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground tracking-wide">QuickCourt App</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground">Customer Login</Link></li>
              <li><Link to="/auth?mode=login" className="hover:text-foreground">Venue Admin Login</Link></li>
              <li><Link to="/features" className="hover:text-foreground">Features & Updates</Link></li>
              <li><Link to="/venues" className="hover:text-foreground">Find a Venue</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© {year} QuickCourt. All Rights Reserved.</div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Customer Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
