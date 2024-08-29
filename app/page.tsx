'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Define the Permission and User interfaces
interface Permission {
  name: string;
  read: boolean;
  write: boolean;
}

interface User {
  _id?: string;
  username: string;
  password: string;
  permissions: Permission[];
}

// Main Page Component
export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    permissions: [
      { name: 'entries', read: false, write: false },
      { name: 'schemas', read: false, write: false },
      { name: 'users', read: false, write: false },
    ],
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      if (response.data.role === 'admin') {
        setIsAuthenticated(true);
        fetchUsers();
      } else {
        setError('You must be an admin to access this page.');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handlePermissionChange = (collectionName: string, action: 'read' | 'write', value: boolean) => {
    setNewUser((prevUser) => ({
      ...prevUser,
      permissions: prevUser.permissions.map((perm) =>
        perm.name === collectionName ? { ...perm, [action]: value } : perm
      ),
    }));
  };

  const handleAddUser = async () => {
    try {
      await axios.post('/api/users', {
        username: newUser.username,
        password: newUser.password,
        permissions: newUser.permissions,
      });
      setNewUser({
        username: '',
        password: '',
        permissions: newUser.permissions.map((perm) => ({ ...perm, read: false, write: false })),
      });
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`/api/users/${userId}`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div style={styles.container}>
      {!isAuthenticated ? (
        <div style={styles.loginContainer}>
          <h1 style={styles.heading}>Admin Login</h1>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>
            Login
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      ) : (
        <div style={styles.dashboardContainer}>
          <h1 style={styles.heading}>Admin Dashboard</h1>
          <h2 style={styles.subHeading}>Users List</h2>
          <ul style={styles.userList}>
            {users.map((user) => (
              <li key={user._id} style={styles.userItem}>
                {user.username}
                <button style={styles.deleteButton} onClick={() => handleDeleteUser(user._id!)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <h2 style={styles.subHeading}>Add New User</h2>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <div style={styles.permissionsContainer}>
            <h3>Set Permissions</h3>
            {newUser.permissions.map((permission) => (
              <div key={permission.name} style={styles.permissionItem}>
                <h4>{permission.name}</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={permission.read}
                    onChange={(e) => handlePermissionChange(permission.name, 'read', e.target.checked)}
                  />
                  Read
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={permission.write}
                    onChange={(e) => handlePermissionChange(permission.name, 'write', e.target.checked)}
                  />
                  Write
                </label>
              </div>
            ))}
          </div>
          <button style={styles.button} onClick={handleAddUser}>
            Add User
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    backgroundColor: '#f4f4f4',
    color: '#000',
  },
  loginContainer: {
    width: '300px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    color: '#000',
  },
  dashboardContainer: {
    width: '600px',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    color: '#000',
  },
  heading: {
    fontSize: '24px',
    marginBottom: '20px',
    textAlign: 'center' as 'center',
    color: '#000',
  },
  subHeading: {
    fontSize: '20px',
    marginBottom: '10px',
    color: '#000',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    color: '#000',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginTop: '10px',
  },
  userList: {
    listStyleType: 'none' as 'none',
    padding: 0,
    color: '#000',
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #ccc',
    color: '#000',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#dc3545',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  permissionsContainer: {
    marginBottom: '20px',
    color: '#000',
  },
  permissionItem: {
    marginBottom: '10px',
    color: '#000',
  },
};
