import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from '../pages/Login'
import { AuthProvider } from '../context/AuthContext'

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    defaults: {
      baseURL: '',
      headers: {
        common: {}
      }
    },
    interceptors: {
      response: {
        use: vi.fn(),
        eject: vi.fn()
      }
    }
  }
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('shows demo login buttons', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('Demo Admin Login')).toBeInTheDocument()
    expect(screen.getByText('Demo Customer Login')).toBeInTheDocument()
  })

  test('validates email field', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Login />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  test('validates password field', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Login />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  test('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Login />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByLabelText(/show password/i)
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  test('shows link to register page', () => {
    renderWithRouter(<Login />)
    
    const registerLink = screen.getByText('Create an account')
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })
})
