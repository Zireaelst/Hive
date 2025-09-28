import React from 'react';
import { Shield, Zap, Users, ArrowRight, MessageSquare, Hexagon, Smartphone, Globe, Lock } from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit';
import hivelogo from '../assets/hivelogo.png';
import bee3d from '../assets/3d-bee.png';

interface LandingPageProps {
  onStartMessaging: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartMessaging }) => {
  return (
      <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img 
                src={hivelogo} 
                alt="Hive" 
                className="h-24 w-auto" 
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

        {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <span>🚀</span>
                <span>Built on Sui Blockchain</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Private Web3
                <span className="block text-yellow-500">Messaging</span>
                <span className="block">for Everyone</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join the buzzing community of privacy-conscious users. Hive delivers secure, 
                decentralized messaging with the simplicity you love and the privacy you deserve.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onStartMessaging}
                  className="inline-flex items-center justify-center px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-all duration-200 hover:scale-105 group"
                >
                  Start Messaging
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 hover:border-yellow-400 text-gray-700 hover:text-yellow-600 font-medium rounded-lg transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="relative">
              {/* Large 3D Bee with Animation */}
              <div className="absolute top-8 -right-20 z-20 group cursor-pointer">
                <img 
                  src={bee3d} 
                  alt="3D Hive Bee" 
                  className="h-80 w-auto transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-2xl filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl group-hover:bg-yellow-400/40 transition-all duration-500 -z-10"></div>
              </div>

              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <Hexagon className="w-5 h-5 text-black fill-current" />
                    </div>
                    <div>
                      <div className="h-2 bg-gray-200 rounded w-20"></div>
                      <div className="h-2 bg-gray-100 rounded w-16 mt-1"></div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg ml-8">
                    <div className="h-2 bg-yellow-200 rounded w-32 mb-2"></div>
                    <div className="h-2 bg-yellow-100 rounded w-24"></div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mr-8">
                    <div className="h-2 bg-gray-200 rounded w-28 mb-2"></div>
                    <div className="h-2 bg-gray-100 rounded w-20"></div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg ml-8">
                    <div className="h-2 bg-yellow-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-yellow-300 rounded-full opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Hive?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience messaging like never before with privacy-first design and Web3 innovation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 bg-gray-50 hover:bg-yellow-50 rounded-2xl transition-colors duration-300">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">End-to-End Privacy</h3>
              <p className="text-gray-600 leading-relaxed">
                Your messages are encrypted with military-grade security. Only you and your recipient can read them.
              </p>
            </div>
            
            <div className="group p-8 bg-gray-50 hover:bg-yellow-50 rounded-2xl transition-colors duration-300">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Built on Sui blockchain for instant message delivery without compromising on security.
              </p>
            </div>
            
            <div className="group p-8 bg-gray-50 hover:bg-yellow-50 rounded-2xl transition-colors duration-300">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community First</h3>
              <p className="text-gray-600 leading-relaxed">
                Join a decentralized network where your data belongs to you, not corporations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                More Than Just Messaging
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Hive brings together the best of Web3 technology with the familiarity of modern messaging apps.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Cross-Platform</h3>
                    <p className="text-gray-400">Available on mobile, desktop, and web</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Global Network</h3>
                    <p className="text-gray-400">Connect with anyone, anywhere in the world</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Zero Knowledge</h3>
                    <p className="text-gray-400">We can't see your messages, even if we wanted to</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-1 rounded-2xl">
                <div className="bg-gray-900 rounded-xl p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-400 text-sm">🔒 Encrypted Chat</span>
                      <span className="text-gray-500 text-sm">Online</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-yellow-400 text-black p-3 rounded-lg max-w-xs ml-auto">
                        <p className="text-sm">Hey! Check out this new Web3 project 🚀</p>
                      </div>
                      
                      <div className="bg-gray-700 text-white p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Looks amazing! The privacy features are exactly what we need</p>
                      </div>
                      
                      <div className="bg-yellow-400 text-black p-3 rounded-lg max-w-xs ml-auto">
                        <p className="text-sm">Right? And it's built on Sui blockchain for speed ⚡</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            Ready to Join the Hive?
          </h2>
          <p className="text-xl text-gray-900 mb-8 opacity-80">
            Start your privacy-first messaging journey today. No data collection, no ads, just secure communication.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
            onClick={onStartMessaging}
              className="inline-flex items-center justify-center px-8 py-4 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-lg"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
            Start Messaging
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 bg-white/20 hover:bg-white/30 text-black font-medium rounded-lg transition-colors text-lg">
              View on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={hivelogo} 
                  alt="Hive" 
                  className="h-24 w-auto" 
                />
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Privacy-first Web3 messaging that puts you in control of your data and conversations.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Hive. Built with privacy in mind.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-yellow-400 text-sm transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
