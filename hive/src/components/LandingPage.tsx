import React from 'react';
import { Shield, Zap, Users, ArrowRight, MessageSquare, Hexagon, Lock } from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit';
import puffinLogo from '../assets/puffin-logo.png';
import penguin from '../assets/puffin.png';

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
                src={puffinLogo} 
                alt="Puffin" 
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
      <section className="pt-24 pb-16 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mb-6" style={{backgroundColor: '#F7A93A', color: '#FFFFFF'}}>
                <span>🚀</span>
                <span>Powered by Sui Stack Messaging SDK</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6" style={{color: '#1C1C1C'}}>
                Decentralized
                <span className="block" style={{color: '#F7A93A'}}>Messaging</span>
                <span className="block">with Seal & Walrus</span>
              </h1>
              
              <p className="text-xl leading-relaxed" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                Experience the future of Web3 messaging with end-to-end encryption powered by Seal, 
                decentralized storage via Walrus, and lightning-fast transactions on Sui blockchain.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onStartMessaging}
                  className="inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:scale-105 group"
                  style={{backgroundColor: '#F7A93A', color: '#FFFFFF'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F47A36'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F7A93A'}
                >
                  Start Messaging
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  className="inline-flex items-center justify-center px-6 py-3 border-2 font-medium rounded-lg transition-colors"
                  style={{borderColor: '#7A4CC2', color: '#7A4CC2'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7A4CC2';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#7A4CC2';
                  }}
                >
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="relative">
              {/* Large Penguin with Animation */}
              <div className="absolute top-8 -right-20 z-20 group cursor-pointer">
                <img 
                  src={penguin} 
                  alt="Hive Penguin" 
                  className="h-80 w-auto transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:drop-shadow-2xl filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-xl transition-all duration-500 -z-10" style={{backgroundColor: 'rgba(247, 169, 58, 0.2)'}}></div>
              </div>

              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #F7A93A, #F47A36)'}}>
                      <Hexagon className="w-5 h-5" style={{color: '#FFFFFF'}} />
                    </div>
                    <div>
                      <div className="h-2 bg-gray-200 rounded w-20"></div>
                      <div className="h-2 bg-gray-100 rounded w-16 mt-1"></div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg ml-8" style={{backgroundColor: 'rgba(247, 169, 58, 0.1)'}}>
                    <div className="h-2 rounded w-32 mb-2" style={{backgroundColor: '#F7A93A'}}></div>
                    <div className="h-2 rounded w-24" style={{backgroundColor: 'rgba(247, 169, 58, 0.6)'}}></div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mr-8">
                    <div className="h-2 bg-gray-200 rounded w-28 mb-2"></div>
                    <div className="h-2 bg-gray-100 rounded w-20"></div>
                  </div>
                  
                  <div className="p-4 rounded-lg ml-8" style={{backgroundColor: 'rgba(247, 169, 58, 0.1)'}}>
                    <div className="h-2 rounded w-24" style={{backgroundColor: '#F7A93A'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{backgroundColor: '#F7A93A'}}></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10" style={{backgroundColor: '#F47A36'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: '#1C1C1C'}}>
              Built on Sui Stack Messaging SDK
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
              Experience the most advanced Web3 messaging stack with Seal encryption, Walrus storage, and Sui blockchain.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl transition-colors duration-300" style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{backgroundColor: 'rgba(247, 169, 58, 0.2)'}}>
                <Shield className="h-6 w-6" style={{color: '#F7A93A'}} />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{color: '#1C1C1C'}}>Seal Encryption</h3>
              <p className="leading-relaxed" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                End-to-end encryption powered by Seal with programmable access control policies. Your messages are secured with military-grade cryptography.
              </p>
            </div>
            
            <div className="group p-8 rounded-2xl transition-colors duration-300" style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{backgroundColor: 'rgba(247, 169, 58, 0.2)'}}>
                <Zap className="h-6 w-6" style={{color: '#F7A93A'}} />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{color: '#1C1C1C'}}>Walrus Storage</h3>
              <p className="leading-relaxed" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                Decentralized, content-addressed storage for attachments. Verifiable and permissionless file sharing with encrypted metadata on-chain.
              </p>
            </div>
            
            <div className="group p-8 rounded-2xl transition-colors duration-300" style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{backgroundColor: 'rgba(247, 169, 58, 0.2)'}}>
                <Users className="h-6 w-6" style={{color: '#F7A93A'}} />
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{color: '#1C1C1C'}}>Sui Blockchain</h3>
              <p className="leading-relaxed" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                Lightning-fast transactions and on-chain message storage. Verifiable, auditable communication with instant finality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20" style={{backgroundColor: '#1C1C1C'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{color: '#FFFFFF'}}>
                Advanced Web3 Messaging Features
              </h2>
              <p className="text-lg mb-8" style={{color: 'rgba(255, 255, 255, 0.7)'}}>
                Hive leverages the complete Sui Stack Messaging SDK for enterprise-grade decentralized communication.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#F7A93A'}}>
                    <MessageSquare className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>1:1 & Group Messaging</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Create direct channels or multi-member groups with defined access rules</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#F7A93A'}}>
                    <Hexagon className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>On-Chain Storage</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Encrypted message objects and metadata stored directly on Sui for verifiable communication</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#F7A93A'}}>
                    <Lock className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>Programmable Access</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Use Sui smart contracts to trigger messaging based on events and governance</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="p-1 rounded-2xl" style={{background: 'linear-gradient(to bottom right, #F7A93A, #F47A36)'}}>
                <div className="rounded-xl p-8" style={{backgroundColor: '#1C1C1C'}}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{color: '#F7A93A'}}>🔒 Encrypted Chat</span>
                      <span className="text-sm" style={{color: 'rgba(255, 255, 255, 0.5)'}}>Online</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg max-w-xs ml-auto" style={{backgroundColor: '#F7A93A', color: '#FFFFFF'}}>
                        <p className="text-sm">Check out this DAO proposal! 🗳️</p>
                      </div>
                      
                      <div className="p-3 rounded-lg max-w-xs" style={{backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF'}}>
                        <p className="text-sm">The Seal encryption is incredible - truly private messaging</p>
                      </div>
                      
                      <div className="p-3 rounded-lg max-w-xs ml-auto" style={{backgroundColor: '#F7A93A', color: '#FFFFFF'}}>
                        <p className="text-sm">Walrus storage makes file sharing so seamless 📎</p>
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
      <section className="py-20" style={{background: 'linear-gradient(to right, #F7A93A, #F47A36)'}}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{color: '#FFFFFF'}}>
            Ready to Experience Web3 Messaging?
          </h2>
          <p className="text-xl mb-8" style={{color: 'rgba(255, 255, 255, 0.8)'}}>
            Join the future of decentralized communication with Seal encryption, Walrus storage, and Sui blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
            onClick={onStartMessaging}
              className="inline-flex items-center justify-center px-8 py-4 font-medium rounded-lg transition-colors text-lg"
              style={{backgroundColor: '#1C1C1C', color: '#FFFFFF'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(28, 28, 28, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1C1C1C'}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
            Start Messaging
            </button>
            <button 
              className="inline-flex items-center justify-center px-8 py-4 font-medium rounded-lg transition-colors text-lg"
              style={{backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              View on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{backgroundColor: '#1C1C1C'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={puffinLogo} 
                  alt="Puffin" 
                  className="h-24 w-auto" 
                />
              </div>
              <p className="mb-6 max-w-md" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                Built on Sui Stack Messaging SDK with Seal encryption, Walrus storage, and Sui blockchain for truly decentralized communication.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-4" style={{color: '#FFFFFF'}}>Product</h3>
              <ul className="space-y-3" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Seal Encryption</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Walrus Storage</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Sui Blockchain</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>SDK Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4" style={{color: '#FFFFFF'}}>Company</h3>
              <ul className="space-y-3" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>About Hive</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Sui Stack SDK</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Developer Resources</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 mt-8" style={{borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                © 2025 Hive. Powered by Sui Stack Messaging SDK.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Privacy Policy</a>
                <a href="#" className="text-sm transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
