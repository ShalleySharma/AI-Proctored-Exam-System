// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import authService from '../../../utils/auth';
// import './StudentLogin.css';

// function StudentLogin() {
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [apiError, setApiError] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     setFormData({ email: '', password: '' });

//     const clearInputs = () => {
//       const emailInput = document.querySelector('input[name="email"]');
//       const passwordInput = document.querySelector('input[name="password"]');

//       if (emailInput) {
//         emailInput.value = '';
//         emailInput.defaultValue = '';
//       }
//       if (passwordInput) {
//         passwordInput.value = '';
//         passwordInput.defaultValue = '';
//       }
//     };

//     setTimeout(clearInputs, 100);
//     setTimeout(clearInputs, 500);
//     setTimeout(clearInputs, 1000);
//   }, []);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.email) {
//       newErrors.email = 'Email is required';
//     } else if (!/@gmail\.com$/.test(formData.email)) {
//       newErrors.email = 'Email must be a valid Gmail address (e.g., example@gmail.com)';
//     }

//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       for (let field in errors) {
//         alert(errors[field]);
//       }
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const res = await authService.login('/api/auth/login', formData);

//       // Assuming your API returns: res.data = { msg, studentId, token }
//       const { msg, studentId, token } = res.data;

//       if (!studentId || !token) {
//         alert('Login failed: Invalid response from server.');
//         return;
//       }

//       // Store studentId and token in localStorage
//       localStorage.setItem('studentId', studentId);
//       localStorage.setItem('token', token);

//       alert(msg || 'Login successful');

//       navigate('/student-dashboard');
//     } catch (err) {
//       const errorMessage = err.response?.data?.msg || 'Login failed';
//       alert(errorMessage);
//       setApiError(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="student-login-container">
//       <div className="student-login-card">
//         <div className="student-login-left">
//           <div style={{ textAlign: 'center' }}>
//             <img src="/images/password.jpg" alt="Student Login" />
//             <h3>Welcome Back Student!</h3>
//             <p>Login to access your account and continue your learning journey.</p>
//           </div>
//         </div>

//         <div className="student-login-right">
//           <h2 className="student-login-title">Student Login</h2>

//           <div className="student-login-content">
//             <form className="student-login-form" onSubmit={handleSubmit} autoComplete="off" data-form="login">
//               <input type="hidden" autoComplete="username" />
//               <input type="hidden" autoComplete="new-password" />

//               {apiError && <div className="student-login-api-error">{apiError}</div>}

//               <div className="student-login-input-group">
//                 <div className="student-login-password">
//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Email Address"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                     className={`student-login-input ${errors.email ? 'error' : ''}`}
//                     autoComplete="off"
//                   />
//                   <i className="bi bi-envelope student-login-password-icon"></i>
//                 </div>
//                 {errors.email && <span className="student-login-error">{errors.email}</span>}
//               </div>

//               <div className="student-login-input-group">
//                 <div className="student-login-password">
//                   <input
//                     type="password"
//                     name="password"
//                     placeholder="Password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     required
//                     className={`student-login-input ${errors.password ? 'error' : ''}`}
//                     autoComplete="off"
//                   />
//                   <i
//                     className="bi bi-eye-slash student-login-password-icon"
//                     onClick={() => {
//                       const input = document.querySelector('input[name="password"]');
//                       input.type = input.type === 'password' ? 'text' : 'password';
//                       const icon = document.querySelector('.student-login-password-icon');
//                       icon.className =
//                         input.type === 'password'
//                           ? 'bi bi-eye-slash student-login-password-icon'
//                           : 'bi bi-eye student-login-password-icon';
//                     }}
//                   ></i>
//                   {errors.password && <span className="student-login-error">{errors.password}</span>}
//                 </div>
//               </div>

//               <button type="submit" className="student-login-submit-btn" disabled={isLoading}>
//                 {isLoading ? (
//                   <>
//                     <i className="bi bi-arrow-repeat me-2 spinning"></i>
//                     Logging in...
//                   </>
//                 ) : (
//                   <>
//                     <i className="bi bi-box-arrow-in-right me-2"></i>
//                     Login as Student
//                   </>
//                 )}
//               </button>
//             </form>
//           </div>

//           <p className="student-login-footer">
//             Don't have an account? <a href="/student-signup">Sign up here</a>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default StudentLogin;

















import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../utils/auth';
import './StudentLogin.css';

function StudentLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/@gmail\.com$/.test(formData.email))
      newErrors.email = 'Email must be a valid Gmail address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await authService.login('/api/auth/login', formData);
      const { msg, studentId, token } = res.data;

      if (!studentId || !token) {
        alert('Login failed: Invalid response from server.');
        return;
      }

      // Store credentials
      localStorage.setItem('studentId', studentId);
      localStorage.setItem('token', token);

      alert(msg || 'Login successful');
      navigate('/student-dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Login failed';
      alert(errorMessage);
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="student-login-card">
        <div className="student-login-left">
          <div style={{ textAlign: 'center' }}>
            <img src="/images/password.jpg" alt="Student Login" />
            <h3>Welcome Back Student!</h3>
            <p>Login to access your account and continue your learning journey.</p>
          </div>
        </div>

        <div className="student-login-right">
          <h2 className="student-login-title">Student Login</h2>

          <div className="student-login-content">
            <form className="student-login-form" onSubmit={handleSubmit} autoComplete="off">
              <input type="hidden" autoComplete="username" />
              <input type="hidden" autoComplete="new-password" />

              {apiError && <div className="student-login-api-error">{apiError}</div>}

              <div className="student-login-input-group">
                <div className="student-login-password">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`student-login-input ${errors.email ? 'error' : ''}`}
                    autoComplete="off"
                  />
                  {errors.email && <span className="student-login-error">{errors.email}</span>}
                </div>
              </div>

              <div className="student-login-input-group">
                <div className="student-login-password">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`student-login-input ${errors.password ? 'error' : ''}`}
                    autoComplete="off"
                  />
                  {errors.password && <span className="student-login-error">{errors.password}</span>}
                </div>
              </div>

              <button type="submit" className="student-login-submit-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login as Student'}
              </button>
            </form>
          </div>

          <p className="student-login-footer">
            Don't have an account? <a href="/student-signup">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
