import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.roles?.[0];

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;