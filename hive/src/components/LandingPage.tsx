import React from 'react';
import { ArrowRight, MessageSquare, Hexagon, Lock, Users, Shield, Coins, Vote } from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit';
import puffinLogo from '../assets/puffin-logo.png';
import puffinLogoWhite from '../assets/puffin-logo-white.png';
import penguin from '../assets/puffin.png';
import puffinBackground from '../assets/puffin-background.png';
import puffinChatbox from '../assets/puffin-chatbox.png';
import puffinPrivacy from '../assets/puffin-priv.png';
import puffinRunning from '../assets/puffin-running.png';
import puffinStorage from '../assets/puffin-storage.png';
import puffinTel from '../assets/puffin-tel.png';

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
      <section id="features" className="bg-white">
        <div className="w-full relative">
          <div className="text-center">
            <img 
              src={puffinBackground} 
              alt="Built on Sui Stack Messaging SDK" 
              className="w-full h-auto block" 
            />
            {/* Soft gradient overlay at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-16 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: '#1C1C1C'}}>
              Web3 Messaging Features
            </h2>
            <p className="text-lg" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
              Experience the power of decentralized communication with our cutting-edge technology stack
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Privacy & Encryption Feature */}
            <div className="group p-6 rounded-2xl transition-all duration-500 cursor-pointer" 
                 style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(247, 169, 58, 0.2)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = '#F5F5F5';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div className="relative mb-6">
                <img 
                  src={puffinPrivacy} 
                  alt="Privacy & Encryption" 
                  className="w-20 h-20 mx-auto transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-xl transition-all duration-500 -z-10 group-hover:opacity-100 opacity-0" style={{backgroundColor: 'rgba(247, 169, 58, 0.3)'}}></div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{color: '#1C1C1C'}}>Privacy First</h3>
              <p className="text-sm leading-relaxed text-center" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                End-to-end encryption powered by Seal with programmable access control policies. Your messages are secured with military-grade cryptography that ensures complete privacy.
              </p>
            </div>
            
            {/* Communication Feature */}
            <div className="group p-6 rounded-2xl transition-all duration-500 cursor-pointer" 
                 style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(247, 169, 58, 0.2)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = '#F5F5F5';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div className="relative mb-6">
                <img 
                  src={puffinRunning} 
                  alt="Fast Communication" 
                  className="w-20 h-20 mx-auto transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-xl transition-all duration-500 -z-10 group-hover:opacity-100 opacity-0" style={{backgroundColor: 'rgba(247, 169, 58, 0.3)'}}></div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{color: '#1C1C1C'}}>Lightning Fast</h3>
              <p className="text-sm leading-relaxed text-center" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                Real-time messaging powered by Sui blockchain with instant finality. Experience seamless communication with sub-second message delivery and reliable performance.
              </p>
            </div>
            
            {/* Storage Feature */}
            <div className="group p-6 rounded-2xl transition-all duration-500 cursor-pointer" 
                 style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(247, 169, 58, 0.2)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = '#F5F5F5';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div className="relative mb-6">
                <img 
                  src={puffinStorage} 
                  alt="Decentralized Storage" 
                  className="w-20 h-20 mx-auto transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-xl transition-all duration-500 -z-10 group-hover:opacity-100 opacity-0" style={{backgroundColor: 'rgba(247, 169, 58, 0.3)'}}></div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{color: '#1C1C1C'}}>Walrus Storage</h3>
              <p className="text-sm leading-relaxed text-center" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                Decentralized, content-addressed storage for attachments and files. Verifiable and permissionless file sharing with encrypted metadata stored on-chain.
              </p>
            </div>
            
            {/* Advanced Features */}
            <div className="group p-6 rounded-2xl transition-all duration-500 cursor-pointer" 
                 style={{backgroundColor: '#F5F5F5'}}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(247, 169, 58, 0.1)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(247, 169, 58, 0.2)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = '#F5F5F5';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div className="relative mb-6">
                <img 
                  src={puffinTel} 
                  alt="Advanced Communications" 
                  className="w-20 h-20 mx-auto transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-xl transition-all duration-500 -z-10 group-hover:opacity-100 opacity-0" style={{backgroundColor: 'rgba(247, 169, 58, 0.3)'}}></div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center" style={{color: '#1C1C1C'}}>Smart Features</h3>
              <p className="text-sm leading-relaxed text-center" style={{color: 'rgba(28, 28, 28, 0.7)'}}>
                Advanced Web3 communication features including governance integration, token-gated channels, and programmable messaging triggered by smart contract events.
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
                Puffin leverages the complete Sui Stack Messaging SDK for enterprise-grade decentralized communication.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#F7A93A'}}>
                    <MessageSquare className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>Advanced Channel Types</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Standard channels, token-gated access, DAO assemblies, and premium subscriptions</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#F7A93A'}}>
                    <Shield className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>Token-Gated Channels</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Access controlled by NFT ownership or token balance with smart contract integration</p>
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
                    <Vote className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>DAO Governance System</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>Decentralized decision making with encrypted governance and transparent voting</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#F7A93A'}}>
                    <Coins className="h-4 w-4" style={{color: '#FFFFFF'}} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1" style={{color: '#FFFFFF'}}>Integrated Payment System</h3>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>In-chat payments, subscription management, and encrypted transaction verification</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Puffin chatbox with subtle effects */}
              <div className="relative group cursor-pointer">
                <img 
                  src={puffinChatbox} 
                  alt="Advanced Web3 Messaging Features" 
                  className="w-full h-auto max-w-lg mx-auto transform transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-2xl filter group-hover:brightness-110 group-hover:contrast-110" 
                />
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-lg blur-xl transition-all duration-500 -z-10" style={{backgroundColor: 'rgba(247, 169, 58, 0.15)'}}></div>
              </div>
              
              {/* Decorative background elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20" style={{backgroundColor: '#F7A93A'}}></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{backgroundColor: '#F47A36'}}></div>
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
                  src={puffinLogoWhite} 
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
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>About Puffin</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Sui Stack SDK</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Developer Resources</a></li>
                <li><a href="#" className="transition-colors" style={{color: 'rgba(255, 255, 255, 0.5)'}} onMouseEnter={(e) => e.currentTarget.style.color = '#F7A93A'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 mt-8" style={{borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm" style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                © 2025 Puffin. Powered by Sui Stack Messaging SDK.
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
