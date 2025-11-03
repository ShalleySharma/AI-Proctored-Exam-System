import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>
        {`
          :root {
            --primary-bg: #FFFFFF;
            --accent-green: #00A85A;
            --secondary-bg: #F8F9FA;
            --text-dark: #1A1A1A;
            --text-muted: #6c757d;
            --shadow-light: 0 2px 15px rgba(0, 168, 90, 0.08);
            --shadow-medium: 0 8px 30px rgba(0, 168, 90, 0.12);
            --shadow-strong: 0 15px 35px rgba(0, 168, 90, 0.15);
            --border-radius: 16px;
            --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          body {
            background-color: var(--primary-bg);
            color: var(--text-dark);
            overflow-x: hidden;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
          }
          /* Hide scrollbar completely */
          ::-webkit-scrollbar {
            display: none;
          }
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          html {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          html::-webkit-scrollbar {
            display: none;
          }
          .hero-section {
            background: transparent;
            min-height: 100vh;
            display: flex;
            align-items: center;
            position: relative;
            overflow: hidden;
          }
          .btn-green {
            background: linear-gradient(135deg, var(--accent-green) 0%, #028E4B 100%);
            border: none;
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: var(--transition);
            box-shadow: var(--shadow-light);
            position: relative;
            overflow: hidden;
          }
          .btn-green::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          .btn-green:hover::before {
            left: 100%;
          }
          .btn-green:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-medium);
          }
          .btn-outline-green {
            border: 2px solid var(--accent-green);
            color: var(--accent-green);
            background: transparent;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
            z-index: 1;
          }
          .btn-outline-green::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--accent-green);
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s ease;
            z-index: -1;
          }
          .btn-outline-green:hover::before {
            transform: scaleX(1);
          }
          .btn-outline-green:hover {
            color: white !important;
            border-color: var(--accent-green);
            transform: translateY(-3px);
            box-shadow: var(--shadow-medium);
          }
          .card-custom {
            background: white;
            border: 1px solid rgba(0, 168, 90, 0.1);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-light);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
          }
          .card-custom::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-green), #028E4B);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .card-custom:hover::before {
            opacity: 1;
          }
          .card-custom:hover {
            transform: translateY(-8px);
            box-shadow: var(--shadow-strong);
            border-color: rgba(0, 168, 90, 0.2);
          }
          .section-bg {
            background-color: var(--secondary-bg);
            position: relative;
          }
          .section-bg::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(0, 168, 90, 0.02) 0%, transparent 100%);
            pointer-events: none;
          }
          .icon-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-green), #028E4B);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            box-shadow: var(--shadow-medium);
            margin: 0 auto 1.5rem;
          }
          .testimonial-card {
            background: white;
            border-radius: var(--border-radius);
            padding: 2rem;
            box-shadow: var(--shadow-light);
            border: 1px solid rgba(0, 168, 90, 0.1);
            position: relative;
            transition: var(--transition);
          }
          .testimonial-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-medium);
          }
          .avatar-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border: 3px solid var(--accent-green);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: var(--accent-green);
            margin-bottom: 1rem;
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="hero-section text-center">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--text-dark)' }}>
                Secure Online Proctoring Platform
              </h1>
              <p className="lead fs-5 mb-5" style={{ color: 'var(--text-muted)' }}>
                Empower educators and students with seamless exam management. Teachers create tests, generate unique IDs, and monitor integrity in real-time.
              </p>
              <div className="d-flex gap-4 flex-wrap justify-content-center">
                <Link to="/teacher-login" className="btn btn-green btn-lg">
                  <i className="bi bi-person-check me-2"></i>I'm a Teacher
                </Link>
                <Link to="/student-login" className="btn btn-outline-green btn-lg">
                  <i className="bi bi-person me-2"></i>I'm a Student
                </Link>
              </div>
              <p className="mt-4 text-muted">
                Already have an account? <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: 'var(--accent-green)' }}>Get Started here</Link>
              </p>
            </div>
            <div className="col-lg-6">
              <img src="/images/home.jpg" alt="Secure Online Proctoring" className="img-fluid rounded" style={{ maxWidth: '70%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* About Our Platform Section */}
      <section id="about" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              About Our Platform
            </h2>
            <p className="lead" style={{ color: 'var(--text-muted)' }}>
              Revolutionizing online education with cutting-edge AI technology
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card-custom p-4 h-100">
                <div className="d-flex align-items-start">
                  <div className="me-4">
                    <i className="bi bi-robot fs-2" style={{ color: 'var(--accent-green)' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-3">AI-Powered Proctoring</h5>
                    <p className="mb-0">Our advanced AI system uses computer vision and machine learning to detect suspicious behavior, multiple faces, and unauthorized activities during exams.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-custom p-4 h-100">
                <div className="d-flex align-items-start">
                  <div className="me-4">
                    <i className="bi bi-shield-lock fs-2" style={{ color: 'var(--accent-green)' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-3">Secure & Reliable</h5>
                    <p className="mb-0">End-to-end encryption, secure databases, and real-time monitoring ensure exam integrity while maintaining student privacy and data protection.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-custom p-4 h-100">
                <div className="d-flex align-items-start">
                  <div className="me-4">
                    <i className="bi bi-graph-up fs-2" style={{ color: 'var(--accent-green)' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-3">Comprehensive Analytics</h5>
                    <p className="mb-0">Detailed reports, violation tracking, and performance analytics help educators make informed decisions and improve assessment quality.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-custom p-4 h-100">
                <div className="d-flex align-items-start">
                  <div className="me-4">
                    <i className="bi bi-people fs-2" style={{ color: 'var(--accent-green)' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-3">User-Friendly Interface</h5>
                    <p className="mb-0">Intuitive dashboards for both teachers and students, with easy test creation, ID generation, and seamless exam taking experience.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5 section-bg">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              How It Works
            </h2>
            <p className="lead" style={{ color: 'var(--text-muted)' }}>
              Simple, secure, and efficient exam management for everyone
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 text-center">
              <div className="card-custom p-4 h-100">
                <div className="mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--accent-green)', color: 'white' }}>
                    <i className="bi bi-person-plus fs-3"></i>
                  </div>
                </div>
                <h5 className="fw-bold mb-3">1. Create Account</h5>
                <p className="mb-0">Teachers and students sign up separately with dedicated dashboards and secure databases.</p>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="card-custom p-4 h-100">
                <div className="mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--accent-green)', color: 'white' }}>
                    <i className="bi bi-clipboard-check fs-3"></i>
                  </div>
                </div>
                <h5 className="fw-bold mb-3">2. Create & Share Test</h5>
                <p className="mb-0">Teachers create exams and generate unique test IDs. Share these IDs with students for secure access.</p>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="card-custom p-4 h-100">
                <div className="mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px', backgroundColor: 'var(--accent-green)', color: 'white' }}>
                    <i className="bi bi-play-circle fs-3"></i>
                  </div>
                </div>
                <h5 className="fw-bold mb-3">3. Take Exam & Monitor</h5>
                <p className="mb-0">Students use the test ID to login and take exams with real-time AI proctoring and comprehensive monitoring.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              Powerful Features
            </h2>
            <p className="lead" style={{ color: 'var(--text-muted)' }}>
              Everything you need for secure, efficient online examinations
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card-custom p-4 h-100">
                <div className="d-flex align-items-start">
                  <div className="me-4">
                    <i className="bi bi-person-badge fs-2" style={{ color: 'var(--accent-green)' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-3">For Teachers</h5>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Create and manage exams</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Generate unique test IDs</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Monitor sessions in real-time</li>
                      <li className="mb-0"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Access detailed reports & PDFs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-custom p-4 h-100">
                <div className="d-flex align-items-start">
                  <div className="me-4">
                    <i className="bi bi-mortarboard fs-2" style={{ color: 'var(--accent-green)' }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-3">For Students</h5>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Simple login with test ID</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>AI-powered proctoring</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Real-time violation detection</li>
                      <li className="mb-0"><i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-green)' }}></i>Secure exam environment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-5 section-bg">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              Trusted by Educators
            </h2>
            <p className="lead" style={{ color: 'var(--text-muted)' }}>
              See what teachers and institutions say about our platform
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card-custom p-4 h-100">
                <div className="mb-3">
                  <i className="bi bi-quote fs-2" style={{ color: 'var(--accent-green)' }}></i>
                </div>
                <p className="mb-3">"Creating tests and sharing IDs with students has never been easier. The monitoring features give me complete peace of mind."</p>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', border: '2px solid var(--accent-green)' }}>
                      SJ
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Sarah Johnson</h6>
                    <small style={{ color: 'var(--text-muted)' }}>High School Teacher</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card-custom p-4 h-100">
                <div className="mb-3">
                  <i className="bi bi-quote fs-2" style={{ color: 'var(--accent-green)' }}></i>
                </div>
                <p className="mb-3">"The separate teacher and student portals make management intuitive. Students love the simple ID-based login system."</p>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', border: '2px solid var(--accent-green)' }}>
                      MR
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Michael Rodriguez</h6>
                    <small style={{ color: 'var(--text-muted)' }}>University Professor</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card-custom p-4 h-100">
                <div className="mb-3">
                  <i className="bi bi-quote fs-2" style={{ color: 'var(--accent-green)' }}></i>
                </div>
                <p className="mb-3">"This platform has revolutionized our online testing. The AI proctoring is reliable, and the interface is beautifully designed."</p>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', border: '2px solid var(--accent-green)' }}>
                      EL
                    </div>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Emily Liu</h6>
                    <small style={{ color: 'var(--text-muted)' }}>Education Director</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
        color: 'var(--text-dark)',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(0, 168, 90, 0.1)',
        borderBottom: '1px solid rgba(0, 168, 90, 0.1)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(0, 168, 90, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 168, 90, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}></div>
        <div className="container text-center position-relative" style={{ zIndex: 1 }}>
          <div className="mb-4">
            <div className="icon-circle" style={{ width: '100px', height: '100px', margin: '0 auto 2rem' }}>
              <i className="bi bi-rocket fs-1"></i>
            </div>
          </div>
          <h2 className="display-5 fw-bold mb-4" style={{ color: 'var(--text-dark)' }}>Ready to Transform Your Exams?</h2>
          <p className="lead mb-5" style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Join thousands of educators who trust our platform for secure, efficient online testing. Start your journey today.
          </p>
          <div className="d-flex justify-content-center gap-4 flex-wrap">
            <Link to="/teacher-signup" className="btn btn-green btn-lg px-5 py-3 fw-semibold">
              <i className="bi bi-person-check me-2"></i>Start as Teacher
            </Link>
            <Link to="/student-signup" className="btn btn-outline-green btn-lg px-5 py-3 fw-semibold">
              <i className="bi bi-person me-2"></i>Join as Student
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#00A85A', color: 'white' }} className="py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5 className="fw-bold mb-3">ProctorAI</h5>
              <p>Secure online proctoring for the modern classroom.</p>
            </div>
            <div className="col-md-3">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li><Link to="/login" className="text-white text-decoration-none">Login</Link></li>
                <li><Link to="/teacher-signup" className="text-white text-decoration-none">Teacher Sign Up</Link></li>
                <li><Link to="/student-signup" className="text-white text-decoration-none">Student Sign Up</Link></li>
                <li><a href="/privacy" className="text-white text-decoration-none">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h6 className="fw-bold mb-3">Contact</h6>
              <p className="mb-1">support@proctorai.com</p>
              <p className="mb-0">© 2024 ProctorAI. All rights reserved.</p>
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">Follow Us</h6>
              <div className="d-flex gap-3">
                <a href="#" className="text-white"><i className="bi bi-facebook fs-4"></i></a>
                <a href="#" className="text-white"><i className="bi bi-twitter fs-4"></i></a>
                <a href="#" className="text-white"><i className="bi bi-linkedin fs-4"></i></a>
                <a href="#" className="text-white"><i className="bi bi-instagram fs-4"></i></a>
              </div>
            </div>
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">Newsletter</h6>
              <p>Subscribe to our newsletter for updates and tips.</p>
              <div className="input-group">
                <input type="email" className="form-control" placeholder="Enter your email" />
                <button className="btn btn-light" type="button">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
