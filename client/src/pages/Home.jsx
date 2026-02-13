import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "../Home.css";
import { useNavigate } from "react-router-dom";



const Home = () => {
  const [activeTab, setActiveTab] = useState('innovation');
  const navigate = useNavigate();
  useEffect(() => {
    // Smooth scrolling for navigation links
   const handleClick = (e) => {
  const href = e.currentTarget.getAttribute('href');
  if (href && href !== '#' && href.startsWith('#')) {  // ✅ ignore '#' only
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
};

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => link.addEventListener('click', handleClick));

    // Active nav link on scroll
    const handleScroll = () => {
      let current = '';
      const sections = document.querySelectorAll('section[id]');
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= (sectionTop - 200)) {
          current = section.getAttribute('id');
        }
      });

      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
          link.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      links.forEach(link => link.removeEventListener('click', handleClick));
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top">
        <div className="container">
          <a className="navbar-brand" href="#">TechNoVa Solutions</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link active" href="#home">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#services">Services</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#pricing">Pricing</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#team">Team</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contact">Contact</a>
              </li>
            </ul>
            <div className="social-icons ms-4">
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-github"></i></a>
              <a href="#"><i className="fab fa-stack-overflow"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-content">
                <span className="badge-custom">IT MANAGEMENT EXCELLENCE</span>
                <h1 className="hero-title">Complete IT Infrastructure Management System</h1>
             <p className="hero-description">
  TECHNOVA Solutions provides a centralized company management system to manage employees, projects, tasks, roles, and reports efficiently using modern web technologies.
</p>

             <div>
  {/* Get Started button */}
  <button
    className="btn btn-primary-custom me-3"
    onClick={() => navigate("/login")}
  >
    Get Started
  </button>

  {/* Watch Demo button */}
  <button
    className="btn btn-secondary-custom"
    onClick={() => navigate("/login")}
  >
    <i className="fas fa-play-circle me-2"></i>
    Watch Demo
  </button>
</div>



                
              </div>
            </div>
            <div className="col-lg-6">
              <div className="row g-4 mt-4 mt-lg-0">
                <div className="col-6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <i className="fas fa-server"></i>
                    </div>
                    <h5 className="feature-title">Asset Management</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <i className="fas fa-headset"></i>
                    </div>
                    <h5 className="feature-title">Help Desk System</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <i className="fas fa-network-wired"></i>
                    </div>
                    <h5 className="feature-title">Network Monitor</h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <i className="fas fa-chart-bar"></i>
                    </div>
                    <h5 className="feature-title">Advanced Reports</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container">
        <div className="stats-section">
          <div className="row">
            <div className="col-md-4">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">IT Assets Managed</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-item">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">System Uptime</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Monitoring Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container py-5" id="about">
        <div className="text-center mb-5">
          <h2 className="section-title">About Our Platform</h2>
          <p className="section-subtitle">Comprehensive IT management solution designed for modern enterprises</p>
        </div>

        <div className="row align-items-center mb-5">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop" 
                 alt="IT Management Dashboard" 
                 className="img-fluid rounded-3" />
          </div>
          <div className="col-lg-6">
            <h2 className="display-6 fw-bold mb-4">Transform Your IT Operations</h2>
            <p className="text-secondary mb-4">
             TECHNOVA Solutions provides a centralized platform to manage company operations including employees, projects, tasks, and reporting.
</p>
            <p className="text-secondary mb-4">
              Our system reduces manual workload, eliminates paperwork, improves response times, and provides real-time insights into your IT environment. With role-based access control and comprehensive audit trails, you maintain complete security and compliance.
            </p>
            <button className="btn btn-primary-custom">Learn More</button>
          </div>
        </div>

        <div className="row g-4 mt-5">
          <div className="col-md-4">
            <div className="about-card">
              <div className="about-icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <h4 className="about-card-title">Our Mission</h4>
              <p className="about-card-text">
                To simplify IT management through innovative automation, enabling organizations to focus on strategic initiatives rather than operational overhead.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="about-card">
              <div className="about-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h4 className="about-card-title">Our Vision</h4>
              <p className="about-card-text">
                Becoming the leading IT management platform globally, trusted by enterprises for reliability, security, and innovation in infrastructure management.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="about-card">
              <div className="about-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h4 className="about-card-title">Our Values</h4>
              <p className="about-card-text">
                Security-first approach, customer success orientation, continuous innovation, and commitment to delivering exceptional value to every client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container py-5" id="services">
        <div className="text-center mb-5">
          <h2 className="section-title">Core Modules</h2>
          <p className="section-subtitle">Powerful features to manage every aspect of your IT infrastructure</p>
        </div>
        
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-laptop"></i>
              </div>
              <h3 className="service-title">Asset Management</h3>
              <p className="service-text">Track all hardware and software assets, manage licenses, monitor depreciation, and maintain complete asset lifecycle from procurement to disposal.</p>
              <a href="#" className="service-link">Learn More <i className="fas fa-arrow-right ms-2"></i></a>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-ticket-alt"></i>
              </div>
              <h3 className="service-title">Help Desk System</h3>
              <p className="service-text">Streamlined ticket management with automated routing, SLA tracking, escalation workflows, and comprehensive knowledge base integration.</p>
              <a href="#" className="service-link">Learn More <i className="fas fa-arrow-right ms-2"></i></a>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-network-wired"></i>
              </div>
              <h3 className="service-title">Network Monitoring</h3>
              <p className="service-text">Real-time network performance monitoring, bandwidth analysis, device health checks, and automated alerts for proactive issue resolution.</p>
              <a href="#" className="service-link">Learn More <i className="fas fa-arrow-right ms-2"></i></a>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <h3 className="service-title">Access Control</h3>
              <p className="service-text">Role-based permissions, user authentication, single sign-on integration, and comprehensive audit logging for security compliance.</p>
              <a href="#" className="service-link">Learn More <i className="fas fa-arrow-right ms-2"></i></a>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="service-title">Analytics & Reports</h3>
              <p className="service-text">Customizable dashboards, scheduled reports, data visualization, and business intelligence tools for data-driven decision making.</p>
              <a href="#" className="service-link">Learn More <i className="fas fa-arrow-right ms-2"></i></a>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div className="service-card">
              <div className="service-icon">
                <i className="fas fa-sync-alt"></i>
              </div>
              <h3 className="service-title">Change Management</h3>
              <p className="service-text">Track IT changes, manage approvals, document configurations, and maintain change history for compliance and rollback capabilities.</p>
              <a href="#" className="service-link">Learn More <i className="fas fa-arrow-right ms-2"></i></a>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Tabs Section */}
      <section className="features-tabs-section py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <span className="badge-small">Advanced Capabilities</span>
              <h2 className="display-6 fw-bold mb-4">Enterprise-Grade IT Management</h2>
              <p className="text-secondary mb-4">
                Discover comprehensive features designed to automate, optimize, and secure your entire IT infrastructure with minimal manual intervention.
              </p>

              {/* Tabs Navigation */}
              <div className="custom-tabs mb-4">
                <button 
                  className={`tab-btn ${activeTab === 'innovation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('innovation')}
                >
                  <span className="tab-number">01</span> Automation<br/>
                  <small>Intelligent workflows</small>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('strategy')}
                >
                  <span className="tab-number">02</span> Integration<br/>
                  <small>Seamless connectivity</small>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('performance')}
                >
                  <span className="tab-number">03</span> Security<br/>
                  <small>Enterprise protection</small>
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'integration' ? 'active' : ''}`}
                  onClick={() => setActiveTab('integration')}
                >
                  <span className="tab-number">04</span> Scalability<br/>
                  <small>Growth ready</small>
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content-area">
                {activeTab === 'innovation' && (
                  <div className="tab-pane-custom">
                    <h3 className="h4 fw-bold mb-3">
                      <i className="fas fa-robot text-primary me-2"></i>
                      Intelligent Automation
                    </h3>
                    <p className="text-secondary mb-4">
                      Automate repetitive IT tasks including ticket routing, asset provisioning, compliance checks, and routine maintenance with AI-powered workflows.
                    </p>
                    <div className="row mb-3">
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">80%</h4>
                          <p className="small mb-0">Time Saved</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">50K+</h4>
                          <p className="small mb-0">Tasks Automated</p>
                        </div>
                      </div>
                    </div>
                    <ul className="feature-list">
                      <li><i className="fas fa-arrow-right me-2"></i>Auto-ticket assignment and routing</li>
                      <li><i className="fas fa-arrow-right me-2"></i>Scheduled maintenance automation</li>
                      <li><i className="fas fa-arrow-right me-2"></i>Compliance audit automation</li>
                    </ul>
                  </div>
                )}
                {activeTab === 'strategy' && (
                  <div className="tab-pane-custom">
                    <h3 className="h4 fw-bold mb-3">
                      <i className="fas fa-puzzle-piece text-primary me-2"></i>
                      Seamless Integration
                    </h3>
                    <p className="text-secondary mb-4">
                      Connect with existing tools including Active Directory, LDAP, email systems, monitoring tools, and third-party applications via REST APIs.
                    </p>
                    <div className="row mb-3">
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">200+</h4>
                          <p className="small mb-0">Integrations</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">100%</h4>
                          <p className="small mb-0">API Coverage</p>
                        </div>
                      </div>
                    </div>
                    <ul className="feature-list">
                      <li><i className="fas fa-arrow-right me-2"></i>Active Directory sync</li>
                      <li><i className="fas fa-arrow-right me-2"></i>Email and calendar integration</li>
                      <li><i className="fas fa-arrow-right me-2"></i>RESTful API for custom apps</li>
                    </ul>
                  </div>
                )}
                {activeTab === 'performance' && (
                  <div className="tab-pane-custom">
                    <h3 className="h4 fw-bold mb-3">
                      <i className="fas fa-lock text-primary me-2"></i>
                      Enterprise Security
                    </h3>
                    <p className="text-secondary mb-4">
                      Multi-layer security with encryption, MFA, role-based access, audit trails, and compliance with SOC 2, ISO 27001, and GDPR standards.
                    </p>
                    <div className="row mb-3">
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">256-bit</h4>
                          <p className="small mb-0">Encryption</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">Zero</h4>
                          <p className="small mb-0">Data Breaches</p>
                        </div>
                      </div>
                    </div>
                    <ul className="feature-list">
                      <li><i className="fas fa-arrow-right me-2"></i>Multi-factor authentication</li>
                      <li><i className="fas fa-arrow-right me-2"></i>End-to-end encryption</li>
                      <li><i className="fas fa-arrow-right me-2"></i>Comprehensive audit logs</li>
                    </ul>
                  </div>
                )}
                {activeTab === 'integration' && (
                  <div className="tab-pane-custom">
                    <h3 className="h4 fw-bold mb-3">
                      <i className="fas fa-expand-arrows-alt text-primary me-2"></i>
                      Unlimited Scalability
                    </h3>
                    <p className="text-secondary mb-4">
                      Cloud-native architecture that scales automatically with your organization's growth, handling millions of assets and thousands of concurrent users.
                    </p>
                    <div className="row mb-3">
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">1M+</h4>
                          <p className="small mb-0">Assets Supported</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="stat-small">
                          <h4 className="text-primary fw-bold">10K+</h4>
                          <p className="small mb-0">Concurrent Users</p>
                        </div>
                      </div>
                    </div>
                    <ul className="feature-list">
                      <li><i className="fas fa-arrow-right me-2"></i>Auto-scaling infrastructure</li>
                      <li><i className="fas fa-arrow-right me-2"></i>Multi-tenant architecture</li>
                      <li><i className="fas fa-arrow-right me-2"></i>Global CDN deployment</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="row g-3 mt-4">
                <div className="col-4">
                  <div className="mini-stat">
                    <h5 className="text-primary fw-bold mb-1">5K+</h5>
                    <p className="small text-secondary mb-0">Organizations</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="mini-stat">
                    <h5 className="text-primary fw-bold mb-1">99.9%</h5>
                    <p className="small text-secondary mb-0">SLA Uptime</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="mini-stat">
                    <h5 className="text-primary fw-bold mb-1">200+</h5>
                    <p className="small text-secondary mb-0">Integrations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="features-image-section">
                <img src="https://plus.unsplash.com/premium_photo-1663040170703-cb0d52d65165?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                     alt="IT Dashboard" 
                     className="img-fluid rounded-3 shadow-lg" />
                <div className="speed-badge">
                  <i className="fas fa-bolt"></i>
                
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <span className="badge-small">Start Your Journey</span>
              <h2 className="display-6 fw-bold mb-3">Ready to Transform Your IT Operations?</h2>
              <p className="text-secondary mb-4">
                Join thousands of organizations worldwide who trust ITManagePro to streamline their IT infrastructure management and boost operational efficiency.
              </p>
              <div className="row g-3">
                <div className="col-6">
                  <div className="cta-stat">
                    <h3 className="text-primary fw-bold">5000+</h3>
                    <p className="mb-0">Active Organizations</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="cta-stat">
                    <h3 className="text-primary fw-bold">97%</h3>
                    <p className="mb-0">Customer Retention</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="cta-stat">
                    <h3 className="text-primary fw-bold">24/7</h3>
                    <p className="mb-0">Expert Support</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="consultation-card">
                <h4 className="fw-bold mb-3">
                  <i className="fas fa-calendar-check text-primary me-2"></i>
                  Schedule a Demo
                </h4>
                <p className="text-secondary mb-4">See ITManagePro in action with a personalized demo</p>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="feature-item-small">
                      <i className="fas fa-database text-primary"></i>
                      <div>
                        <h6 className="mb-1">Asset Tracking</h6>
                        <p className="small text-secondary mb-0">Complete inventory control</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feature-item-small">
                      <i className="fas fa-headset text-primary"></i>
                      <div>
                        <h6 className="mb-1">Help Desk</h6>
                        <p className="small text-secondary mb-0">Efficient ticket resolution</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feature-item-small">
                      <i className="fas fa-chart-bar text-primary"></i>
                      <div>
                        <h6 className="mb-1">Real-time Reports</h6>
                        <p className="small text-secondary mb-0">Actionable insights</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feature-item-small">
                      <i className="fas fa-lock text-primary"></i>
                      <div>
                        <h6 className="mb-1">Secure Access</h6>
                        <p className="small text-secondary mb-0">Role-based permissions</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <button className="btn btn-primary-custom flex-fill">Request Demo</button>
                  <button className="btn btn-secondary-custom">Start Free Trial</button>
                </div>

                <p className="text-center mt-3 mb-0">
                  <i className="fas fa-phone text-primary me-2"></i>
                  Or call us at <strong>+1 (800) 123-4567</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-5" id="pricing">
        <div className="text-center mb-5">
          <h2 className="section-title">Flexible Pricing Plans</h2>
          <p className="section-subtitle">Choose the plan that fits your organization's size and needs</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-plan">Starter</h3>
                <div className="pricing-price">
                  <span className="currency">$</span>
                  <span className="amount">99</span>
                  <span className="period">/month</span>
                </div>
                <p className="pricing-desc">For small IT teams</p>
              </div>
              <ul className="pricing-features">
                <li><i className="fas fa-check text-primary me-2"></i>Up to 100 assets</li>
                <li><i className="fas fa-check text-primary me-2"></i>5 help desk agents</li>
                <li><i className="fas fa-check text-primary me-2"></i>Basic reporting</li>
                <li><i className="fas fa-check text-primary me-2"></i>Email support</li>
                <li><i className="fas fa-check text-primary me-2"></i>10GB storage</li>
              </ul>
              <button className="btn btn-outline-primary w-100">Start Free Trial</button>
            </div>
          </div>

          <div className="col-lg-4 col-md-6">
            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-header">
                <h3 className="pricing-plan">Professional</h3>
                <div className="pricing-price">
                  <span className="currency">$</span>
                  <span className="amount">299</span>
                  <span className="period">/month</span>
                </div>
                <p className="pricing-desc">For growing organizations</p>
              </div>
              <ul className="pricing-features">
                <li><i className="fas fa-check text-primary me-2"></i>Up to 1000 assets</li>
                <li><i className="fas fa-check text-primary me-2"></i>25 help desk agents</li>
                <li><i className="fas fa-check text-primary me-2"></i>Advanced analytics</li>
                <li><i className="fas fa-check text-primary me-2"></i>Priority support</li>
                <li><i className="fas fa-check text-primary me-2"></i>100GB storage</li>
                <li><i className="fas fa-check text-primary me-2"></i>API access</li>
                <li><i className="fas fa-check text-primary me-2"></i>Network monitoring</li>
              </ul>
              <button className="btn btn-primary-custom w-100">Start Free Trial</button>
            </div>
          </div>

          <div className="col-lg-4 col-md-6">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-plan">Enterprise</h3>
                <div className="pricing-price">
                  <span className="currency">$</span>
                  <span className="amount">799</span>
                  <span className="period">/month</span>
                </div>
                <p className="pricing-desc">For large enterprises</p>
              </div>
              <ul className="pricing-features">
                <li><i className="fas fa-check text-primary me-2"></i>Unlimited assets</li>
                <li><i className="fas fa-check text-primary me-2"></i>Unlimited agents</li>
                <li><i className="fas fa-check text-primary me-2"></i>Custom reporting</li>
                <li><i className="fas fa-check text-primary me-2"></i>24/7 dedicated support</li>
                <li><i className="fas fa-check text-primary me-2"></i>Unlimited storage</li>
                <li><i className="fas fa-check text-primary me-2"></i>Advanced security</li>
                <li><i className="fas fa-check text-primary me-2"></i>Custom integrations</li>
              </ul>
              <button className="btn btn-outline-primary w-100">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container py-5" id="team">
        <div className="text-center mb-5">
          <h2 className="section-title">Our Professional Team</h2>
          <p className="section-subtitle">Meet the team behind TECHNOVA Solutions</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-3 col-md-6">
            <div className="team-card">
              <div className="team-image">
                 <img
          src="https://plus.unsplash.com/premium_photo-1683121009207-718ad5acfa49?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Team member"
          className="img-fluid"
        />
                <div className="team-social">
                  <a href="#"><i className="fab fa-twitter"></i></a>
                  <a href="#"><i className="fab fa-github"></i></a>
                  <a href="#"><i className="fab fa-stack-overflow"></i></a>
                  <a href="#"><i className="fab fa-linkedin"></i></a>
                </div>
              </div>
              <div className="team-info">
                <h4 className="team-name">Daniel Roberts</h4>
                <p className="team-role">Chief Technology Officer</p>
                <p className="team-desc">20+ years in enterprise IT architecture and cloud infrastructure</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="team-card">
              <div className="team-image">
               <img
          src="https://plus.unsplash.com/premium_photo-1661522403494-4c3c5f6c97c8?q=80&w=2719&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Team member"
          className="img-fluid"
        />
                <div className="team-social">
                  <a href="#"><i className="fab fa-twitter"></i></a>
                  <a href="#"><i className="fab fa-github"></i></a>
                  <a href="#"><i className="fab fa-stack-overflow"></i></a>
                  <a href="#"><i className="fab fa-linkedin"></i></a>
                </div>
              </div>
              <div className="team-info">
                <h4 className="team-name">Olivia Brown</h4>
                <p className="team-role">Lead Developer</p>
                <p className="team-desc">Full-stack expert specializing in scalable IT management systems</p>
              </div>
            </div>
          </div>





          <div className="col-lg-3 col-md-6">
            <div className="team-card">
              <div className="team-image">
                  <img
          src="https://plus.unsplash.com/premium_photo-1661377166972-42f22607c24e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Team member"
          className="img-fluid"
        />
                <div className="team-social">
                  <a href="#"><i className="fab fa-twitter"></i></a>
                  <a href="#"><i className="fab fa-github"></i></a>
                  <a href="#"><i className="fab fa-stack-overflow"></i></a>
                  <a href="#"><i className="fab fa-linkedin"></i></a>
                </div>
              </div>
              <div className="team-info">
                <h4 className="team-name">William Carter</h4>
                <p className="team-role">Head of Security</p>
                <p className="team-desc">Cybersecurity expert ensuring enterprise-grade protection</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="team-card">
              <div className="team-image">
                 <img
          src="https://plus.unsplash.com/premium_photo-1664910307765-688299f84d3a?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Team member"
          className="img-fluid"
        />
                <div className="team-social">
                  <a href="#"><i className="fab fa-twitter"></i></a>
                  <a href="#"><i className="fab fa-github"></i></a>
                  <a href="#"><i className="fab fa-stack-overflow"></i></a>
                  <a href="#"><i className="fab fa-linkedin"></i></a>
                </div>
              </div>
              <div className="team-info">
                <h4 className="team-name">Charlotte Miller</h4>
                <p className="team-role">Product Manager</p>
                <p className="team-desc">Driving product innovation and customer success initiatives</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container py-5" id="contact">
        <div className="text-center mb-5">
          <h2 className="section-title">Contact Us</h2>
          <p className="section-subtitle">Get in touch with our support and sales teams</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="contact-info-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h4 className="contact-title">Email Support</h4>
              <p className="contact-detail">support@technovasolutions.com</p>
              <p className="contact-note">
                <i className="fas fa-circle text-success me-2" style={{fontSize: '8px'}}></i>
                Response within 2 hours
              </p>
            </div>

            <div className="contact-info-card">
              <div className="contact-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h4 className="contact-title">Phone Support</h4>
              <p className="contact-detail">+1 (800) 123-4567</p>
              <p className="contact-note">
                <i className="fas fa-circle text-success me-2" style={{fontSize: '8px'}}></i>
                Available 24/7
              </p>
            </div>

            <div className="contact-info-card">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h4 className="contact-title">Head Office</h4>
              <p className="contact-detail">Tech Park, Whitefield<br/>Bangalore, KA 560066</p>
              <p className="contact-note">
                <i className="fas fa-circle text-success me-2" style={{fontSize: '8px'}}></i>
                Mon-Sat: 9AM-6PM IST
              </p>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="contact-form-card">
              <div className="mb-4">
                <span className="badge-small">Get Started</span>
                <h3 className="h4 fw-bold mt-2">Send us a message</h3>
                <p className="text-secondary">Our team will respond within 24 hours</p>
              </div>

              <form>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input type="text" className="form-control custom-input" placeholder="Full Name" required />
                  </div>
                  <div className="col-md-6">
                    <input type="email" className="form-control custom-input" placeholder="Work Email" required />
                  </div>
                  <div className="col-md-6">
                    <input type="text" className="form-control custom-input" placeholder="Company Name" />
                  </div>
                  {/* <div className="col-md-6">
                    <select className="form-select custom-input">
                      <option selected>Select Inquiry Type</option>
                      <option value="demo">Request Demo</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div> */}
                  <div className="col-12">
                    <textarea className="form-control custom-input" rows="5" placeholder="Tell us about your IT management requirements"></textarea>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary-custom w-100">
                      Send Message <i className="fas fa-paper-plane ms-2"></i>
                    </button>
                    <p className="text-center mt-3 mb-0 small text-secondary">
                      <i className="fas fa-shield-alt me-2"></i>
                      Your information is secure and will never be shared
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Contact Stats */}
        <div className="row g-4 mt-5">
          <div className="col-md-4">
            <div className="contact-stat-card">
              <i className="fas fa-clock text-primary mb-3"></i>
              <h5 className="fw-bold">Fast Response</h5>
              <p className="text-secondary mb-0">Average 2-hour reply time</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="contact-stat-card">
              <i className="fas fa-users text-primary mb-3"></i>
              <h5 className="fw-bold">Expert Team</h5>
              <p className="text-secondary mb-0">50+ support professionals</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="contact-stat-card">
              <h4 className="text-primary fw-bold mb-2">4.8/5</h4>
              <h5 className="fw-bold">Support Rating</h5>
              <p className="text-secondary mb-0">5000+ satisfied clients</p>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="text-center mt-5">
          <p className="text-secondary mb-3">Connect with us on social media</p>
          <div className="social-links-large">
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-github"></i></a>
            <a href="#"><i className="fab fa-stack-overflow"></i></a>
            <a href="#"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-5 mt-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <h3 className="navbar-brand mb-3">TECHNOVA Solutions</h3>

              <p className="text-secondary mb-3">Tech Park, Whitefield<br/>Bangalore, KA 560066</p>
              <p className="text-secondary mb-2">
                <strong>Phone:</strong> +1 (800) 123-4567
              </p>
              <p className="text-secondary">
                <strong>Email:</strong> info@itmanagepro.com
              </p>
              <div className="social-icons mt-3">
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-github"></i></a>
                <a href="#"><i className="fab fa-stack-overflow"></i></a>
                <a href="#"><i className="fab fa-linkedin"></i></a>
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5 className="fw-bold mb-3">Quick Links</h5>
              <ul className="footer-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#team">Team</a></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5 className="fw-bold mb-3">Features</h5>
              <ul className="footer-links">
                <li><a href="#">Asset Management</a></li>
                <li><a href="#">Help Desk</a></li>
                <li><a href="#">Network Monitor</a></li>
                <li><a href="#">Access Control</a></li>
                <li><a href="#">Analytics</a></li>
              </ul>
            </div>

            <div className="col-lg-4 col-md-12">
              <h5 className="fw-bold mb-3">Newsletter</h5>
              <p className="text-secondary mb-3">Get IT management tips and product updates</p>
              <div className="newsletter-form">
                <input type="email" className="form-control" placeholder="Your email address" />
                <button className="btn btn-primary-custom mt-2 w-100">Subscribe</button>
              </div>
            </div>
          </div>

          <hr className="my-4" style={{borderColor: 'rgba(255,255,255,0.1)'}} />

          <div className="text-center">
            <p className="mb-0 text-secondary">
              © Copyright <strong>TECHNOVA Solutions</strong> All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;