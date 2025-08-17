import { Link } from 'react-router-dom';
import { ArrowRight, Server, Shield, Zap, Code, Database, Lock, Github } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showToast]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <div className="min-h-screen bg-white-100 dark:bg-black-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white-100/90 dark:bg-black-900/90 backdrop-blur-sm shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">Shard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <Link
                  to="/app"
                  className="group relative inline-flex items-center justify-center py-2 px-4 border-2 border-black-900 rounded-none shadow-sm bg-black-900 text-sm font-medium text-white-100 transition-all duration-200 overflow-hidden dark:bg-white-100 dark:border-white-100 dark:text-black-900"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-[110%] group-hover:translate-x-0 dark:bg-black-900 pointer-events-none" />
                  <span className="relative z-10 transition-colors duration-200 text-white-100 dark:text-black-900 group-hover:text-black-900 dark:group-hover:text-white-100">
                    Go to Dashboard
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="group relative inline-flex justify-center py-2 px-4 border-2 border-black-900 rounded-none shadow-sm bg-white-100 text-sm font-medium text-black-900 hover:text-white-100 dark:bg-black-900 dark:border-2 dark:border-white-100 dark:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full bg-black-900 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-white-100"></span>
                    <span className="relative z-10">Sign In</span>
                  </Link>
                  <Link
                    to="/auth/register"
                    className="group relative inline-flex items-center justify-center py-2 px-4 border-2 border-black-900 rounded-none shadow-sm bg-black-900 text-sm font-medium text-white-100 transition-all duration-200 overflow-hidden dark:bg-white-100 dark:border-white-100 dark:text-black-900"
                  >
                    <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-[110%] group-hover:translate-x-0 dark:bg-black-900 pointer-events-none" />
                    <span className="relative z-10 transition-colors duration-200 text-white-100 dark:text-black-900 group-hover:text-black-900 dark:group-hover:text-white-100">
                      Get Started
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-black-900 dark:text-white-100 mb-6">
              Deploy
              <span className="block text-black-700 dark:text-white-300 mt-2">Without Limits</span>
            </h1>
            <p className="text-xl lg:text-2xl text-black-600 dark:text-white-400 mb-8 max-w-2xl mx-auto lg:mx-0">
              The modern deployment platform that scales with your needs. Deploy any stack, any language, anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {currentUser ? (
                <Link
                  to="/app"
                  className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
                  <span className="relative z-10 flex items-center">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              ) : (
                <Link
                  to="/auth/register"
                  className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
                  <span className="relative z-10 flex items-center">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Link>
              )}
              <button
                onClick={scrollToFeatures}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none border-2 border-black-900 text-black-900 hover:text-white-100 dark:border-2 dark:border-white-100 dark:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-black-900 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-white-100"></span>
                <span className="relative z-10">Explore Features</span>
              </button>

            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-4 bg-white-200 dark:bg-black-700 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105">
                  <Server className="h-10 w-10 text-black-900 dark:text-white-100 mb-3" />
                  <h3 className="text-base font-semibold text-black-900 dark:text-white-100">Auto-Scaling</h3>
                  <p className="text-xs text-black-600 dark:text-white-400">Scale from zero to millions</p>
                </div>
                <div className="p-4 bg-white-200 dark:bg-black-700 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105">
                  <Shield className="h-10 w-10 text-black-900 dark:text-white-100 mb-3" />
                  <h3 className="text-base font-semibold text-black-900 dark:text-white-100">Security</h3>
                  <p className="text-xs text-black-600 dark:text-white-400">SOC 2 compliant</p>
                </div>
              </div>
              <div className="space-y-6 mt-12">
                <div className="p-4 bg-white-200 dark:bg-black-700 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105">
                  <Zap className="h-10 w-10 text-black-900 dark:text-white-100 mb-3" />
                  <h3 className="text-base font-semibold text-black-900 dark:text-white-100">Lightning Fast</h3>
                  <p className="text-xs text-black-600 dark:text-white-400">Deploy in seconds</p>
                </div>
                <div className="p-4 bg-white-200 dark:bg-black-700 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105">
                  <Code className="h-10 w-10 text-black-900 dark:text-white-100 mb-3" />
                  <h3 className="text-base font-semibold text-black-900 dark:text-white-100">AI-Powered</h3>
                  <p className="text-xs text-black-600 dark:text-white-400">Smart review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white-200 dark:bg-black-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-black-600 dark:text-white-400 max-w-3xl mx-auto">
              From development to production, Shard provides the tools and infrastructure you need to succeed.
            </p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            <div className="break-inside-avoid bg-white-100 dark:bg-black-700 p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 rounded-none bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 mb-6">
                <Server className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Auto-Scaling</h3>
              <p className="text-black-600 dark:text-white-400 mb-4">
                Automatically scale your applications based on demand. From zero to millions of requests without any configuration.
              </p>
              <ul className="text-sm text-black-500 dark:text-white-300 space-y-2">
                <li>• Horizontal & vertical scaling</li>
                <li>• Zero-downtime deployments</li>
                <li>• Load balancing included</li>
              </ul>
            </div>

            <div className="break-inside-avoid bg-white-100 dark:bg-black-700 p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 rounded-none bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Enterprise Security</h3>
              <p className="text-black-600 dark:text-white-400 mb-4">
                Built with security-first principles. Your applications and data are protected with industry-leading security measures.
              </p>
              <ul className="text-sm text-black-500 dark:text-white-300 space-y-2">
                <li>• SOC 2 Type II compliant</li>
                <li>• End-to-end encryption</li>
                <li>• Vulnerability scanning</li>
              </ul>
            </div>

            <div className="break-inside-avoid bg-white-100 dark:bg-black-700 p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 rounded-none bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Lightning Fast</h3>
              <p className="text-black-600 dark:text-white-400 mb-4">
                Deploy your applications in seconds, not minutes. Optimized build processes and global CDN for maximum performance.
              </p>
              <ul className="text-sm text-black-500 dark:text-white-300 space-y-2">
                <li>• Global edge network</li>
                <li>• Optimized build pipelines</li>
                <li>• Instant rollbacks</li>
              </ul>
            </div>

            <div className="break-inside-avoid bg-white-100 dark:bg-black-700 p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 rounded-none bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 mb-6">
                <Code className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">AI-Powered Review</h3>
              <p className="text-black-600 dark:text-white-400 mb-4">
                Advanced AI analyzes your code for security vulnerabilities, performance issues, and best practices before deployment.
              </p>
              <ul className="text-sm text-black-500 dark:text-white-300 space-y-2">
                <li>• Security vulnerability detection</li>
                <li>• Performance optimization tips</li>
                <li>• Code quality insights</li>
              </ul>
            </div>

            <div className="break-inside-avoid bg-white-100 dark:bg-black-700 p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 rounded-none bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 mb-6">
                <Database className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Environment Management</h3>
              <p className="text-black-600 dark:text-white-400 mb-4">
                Secure environment variable management with encryption, team collaboration, and project-specific configurations.
              </p>
              <ul className="text-sm text-black-500 dark:text-white-300 space-y-2">
                <li>• Encrypted storage</li>
                <li>• Team collaboration</li>
                <li>• Staging & production</li>
              </ul>
            </div>

            <div className="break-inside-avoid bg-white-100 dark:bg-black-700 p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center h-16 w-16 rounded-none bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 mb-6">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Git Integration</h3>
              <p className="text-black-600 dark:text-white-400 mb-4">
                Seamless integration with GitHub and GitLab. Deploy directly from your repositories with automatic builds on push.
              </p>
              <ul className="text-sm text-black-500 dark:text-white-300 space-y-2">
                <li>• GitHub & GitLab integration</li>
                <li>• Automatic deployments</li>
                <li>• Branch-based environments</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black-900 dark:bg-white-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-white-100 dark:text-black-900 mb-6">
            Ready to Deploy?
          </h2>
          <p className="text-xl text-white-200 dark:text-black-700 mb-8">
            Join thousands of developers who trust Shard for their deployments. Start free, no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Primary CTA */}
            {currentUser ? (
              <Link
                to="/dashboard"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm
                     bg-white-100 text-black-900 dark:bg-black-900 dark:text-white-100 transition-all duration-200 overflow-hidden
                     border-2 border-white-100 dark:border-black-900"
              >
                {/* overlay: starts slightly off-screen; pointer-events-none keeps link clickable */}
                <span className="absolute inset-0 w-full h-full bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-[110%] group-hover:translate-x-0 dark:bg-white-100 pointer-events-none" />
                <span className="relative z-10 flex items-center transition-colors duration-200
                           text-black-900 dark:text-white-100
                           group-hover:text-white-100 dark:group-hover:text-black-900">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-colors duration-200 group-hover:text-white-100 dark:group-hover:text-black-900" />
                </span>
              </Link>
            ) : (
              <Link
                to="/auth/register"
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm
                     bg-white-100 text-black-900 dark:bg-black-900 dark:text-white-100 transition-all duration-200 overflow-hidden
                     border-2 border-white-100 dark:border-black-900"
              >
                {/* overlay: starts slightly off-screen; pointer-events-none keeps link clickable */}
                <span className="absolute inset-0 w-full h-full bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-[110%] group-hover:translate-x-0 dark:bg-white-100 pointer-events-none" />
                <span className="relative z-10 flex items-center transition-colors duration-200
                           text-black-900 dark:text-white-100
                           group-hover:text-white-100 dark:group-hover:text-black-900">
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-colors duration-200 group-hover:text-white-100 dark:group-hover:text-black-900" />
                </span>
              </Link>
            )}

            {/* Secondary (GitHub) */}
            <a
              href="https://github.com/utsav-mistry/Shard"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none
                   border-2 border-white-100 text-white-100 dark:border-black-900 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100
                   transition-all duration-200 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-[110%] group-hover:translate-x-0 dark:bg-black-900 pointer-events-none" />
              <span className="relative z-10 flex items-center transition-colors duration-200
                         text-white-100 dark:text-black-900
                         group-hover:text-black-900 dark:group-hover:text-white-100">
                <Github className="mr-2 h-4 w-4 transition-colors duration-200 group-hover:text-black-900 dark:group-hover:text-white-100" />
                View on GitHub
              </span>
            </a>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-white-200 dark:bg-black-800 border-t border-black-200 dark:border-white-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-bold text-black-900 dark:text-white-100">Shard</h3>
              <p className="text-sm text-black-600 dark:text-white-400">Modern deployment platform</p>
            </div>
            <div className="flex space-x-6">
              <a
                href="https://github.com/utsav-mistry/Shard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 transition-colors duration-200"
              >
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-black-200 dark:border-white-700 text-center">
            <p className="text-sm text-black-600 dark:text-white-400">
              &copy; {new Date().getFullYear()} Shard. Built with modern technologies for modern developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
