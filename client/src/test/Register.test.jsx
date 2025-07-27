import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Register from '../pages/Register'
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

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders registration form', () => {
    renderWithRouter(<Register />)
    
    expect(screen.getByText('Join Sweet Shop')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  test('shows customer-only registration note', () => {
    renderWithRouter(<Register />)
    
    expect(screen.getByText(/you're registering as a customer/i)).toBeInTheDocument()
  })

  test('validates all required fields', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Register />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })
  })

  test('validates password confirmation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Register />)
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'differentpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  test('validates minimum password length', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Register />)
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  test('validates email format', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Register />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  test('clears validation errors when user types', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Register />)
    
    const nameInput = screen.getByLabelText(/full name/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Trigger validation error
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
    
    // Type in field to clear error
    await user.type(nameInput, 'John Doe')
    
    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
    })
  })

  test('shows link to login page', () => {
    renderWithRouter(<Register />)
    
    const loginLink = screen.getByText('Sign in here')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })
})
