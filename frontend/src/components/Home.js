import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function Home() {
  const observer = useRef(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.current.observe(el));

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="min-vh-100 d-flex align-items-center justify-content-center text-center position-relative"
        style={{
          background: 'var(--gradient)',
          color: 'white'
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 fade-in-up">
              <h1 className="display-3 fw-bold mb-4">
                Secure Online Proctoring System
              </h1>
              <p className="lead fs-4 mb-5 opacity-90">
                Ensure exam integrity with advanced AI-powered monitoring. Detect face spoofing, track eye movement, and prevent cheating in real-time.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/signup" className="btn btn-light btn-lg px-5 py-3 fw-semibold">
                  Get Started - Sign Up
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold">
                  Login
                </Link>
              </div>
            </div>
            <div className="col-lg-6 fade-in-up">
              <img src="/images/home_bg.png" alt="Home Background" className="img-fluid rounded" />
            </div>
          </div>
        </div>
        <div className="position-absolute bottom-0 start-50 translate-middle-x">
          <a href="#about" className="btn btn-link text-white">
            <i className="bi bi-chevron-down fs-2"></i>
          </a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 animate-on-scroll d-flex justify-content-center">
              <img src="/images/about_bg.png" alt="About Background" className="img-fluid rounded" />
            </div>
            <div className="col-lg-6 animate-on-scroll">
              <h2 className="display-5 fw-bold mb-4" style={{ color: 'var(--dark-color)' }}>
                About Our Platform
              </h2>
              <p className="lead mb-4">
                Our cutting-edge online proctoring system revolutionizes exam security by leveraging artificial intelligence and real-time monitoring to ensure fair and trustworthy assessments.
              </p>
              <p>
                With advanced face recognition, behavioral analysis, and comprehensive reporting, we provide educators with the tools they need to maintain academic integrity in the digital age.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--dark-color)' }}>
              Key Features
            </h2>
            <p className="lead text-muted">
              Discover the powerful capabilities that make our proctoring system unparalleled
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 animate-on-scroll">
              <div className="card h-100 border-0 shadow-lg hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-camera-video-fill fs-1 float" style={{ color: 'var(--primary-color)' }}></i>
                  </div>
                  <h5 className="card-title fw-bold">Real-Time Monitoring</h5>
                  <p className="card-text">Continuous webcam surveillance with periodic snapshots to ensure constant oversight.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 animate-on-scroll">
              <div className="card h-100 border-0 shadow-lg hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-shield-check fs-1 float" style={{ color: 'var(--secondary-color)' }}></i>
                  </div>
                  <h5 className="card-title fw-bold">Cheating Detection</h5>
                  <p className="card-text">AI-powered detection of face spoofing, multiple faces, and suspicious behavior patterns.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 animate-on-scroll">
              <div className="card h-100 border-0 shadow-lg hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-graph-up fs-1 float" style={{ color: 'var(--accent-color)' }}></i>
                  </div>
                  <h5 className="card-title fw-bold">Instructor Dashboard</h5>
                  <p className="card-text">Comprehensive dashboard for reviewing sessions, violations, and snapshots for detailed analysis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5" style={{ backgroundColor: 'var(--light-color)' }}>
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--dark-color)' }}>
              How It Works
            </h2>
            <p className="lead text-muted">
              Simple steps to secure your online examinations
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 text-center animate-on-scroll">
              <div className="mb-3">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', background: 'var(--gradient)', color: 'white' }}>
                  <span className="fw-bold fs-4">1</span>
                </div>
              </div>
              <h5 className="fw-bold">Setup Exam</h5>
              <p>Create your exam session and configure monitoring parameters through our intuitive dashboard.</p>
            </div>
            <div className="col-md-4 text-center animate-on-scroll">
              <div className="mb-3">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', background: 'var(--gradient)', color: 'white' }}>
                  <span className="fw-bold fs-4">2</span>
                </div>
              </div>
              <h5 className="fw-bold">Student Access</h5>
              <p>Students log in and begin their exam with automatic proctoring activation.</p>
            </div>
            <div className="col-md-4 text-center animate-on-scroll">
              <div className="mb-3">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', background: 'var(--gradient)', color: 'white' }}>
                  <span className="fw-bold fs-4">3</span>
                </div>
              </div>
              <h5 className="fw-bold">Monitor & Review</h5>
              <p>Real-time monitoring with AI analysis, followed by comprehensive session reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5 animate-on-scroll">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--dark-color)' }}>
              What Our Users Say
            </h2>
            <p className="lead text-muted">
              Trusted by educators worldwide
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4 animate-on-scroll">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-quote fs-2 text-muted"></i>
                  </div>
                  <p className="card-text mb-3">
                    "This proctoring system has transformed our online exams. The AI detection is incredibly accurate, and the dashboard makes reviewing sessions effortless."
                  </p>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px' }}>
                        JD
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">Dr. Jane Doe</h6>
                      <small className="text-muted">Professor, University of Tech</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 animate-on-scroll">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-quote fs-2 text-muted"></i>
                  </div>
                  <p className="card-text mb-3">
                    "The ease of use and reliability of this platform have made online proctoring stress-free. Highly recommended for any educational institution."
                  </p>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <div className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px' }}>
                        MS
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">Mark Smith</h6>
                      <small className="text-muted">IT Director, Online Academy</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 animate-on-scroll">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <i className="bi bi-quote fs-2 text-muted"></i>
                  </div>
                  <p className="card-text mb-3">
                    "Outstanding technology that ensures exam integrity without compromising the student experience. A game-changer for online education."
                  </p>
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <div className="rounded-circle bg-accent d-inline-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px' }}>
                        AL
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">Dr. Alice Lee</h6>
                      <small className="text-muted">Dean, Digital University</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-5" style={{ background: 'var(--gradient)', color: 'white' }}>
        <div className="container">
          <div className="text-center animate-on-scroll">
            <h2 className="display-5 fw-bold mb-4">Ready to Get Started?</h2>
            <p className="lead mb-4 opacity-90">
              Join thousands of educators who trust our platform for secure online examinations.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link to="/signup" className="btn btn-light btn-lg px-5 py-3 fw-semibold">
                Sign Up Now
              </Link>
              <a href="mailto:support@proctoringsystem.com" className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 animate-on-scroll">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5 className="fw-bold mb-3">Proctoring System</h5>
              <p>Ensuring academic integrity through innovative technology.</p>
            </div>
            <div className="col-md-3">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled">
                <li><Link to="/login" className="text-white text-decoration-none">Login</Link></li>
                <li><Link to="/signup" className="text-white text-decoration-none">Sign Up</Link></li>
                <li><a href="/privacy" className="text-white text-decoration-none">Privacy Policy</a></li>
                <li><a href="/terms" className="text-white text-decoration-none">Terms of Service</a></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h6 className="fw-bold mb-3">Contact</h6>
              <p className="mb-1">support@proctoringsystem.com</p>
              <p className="mb-0">© 2023 Proctoring System. All rights reserved.</p>
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
                <button className="btn btn-primary" type="button">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
