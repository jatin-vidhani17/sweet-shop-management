import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Navbar from '../components/Navbar'
import { AuthProvider } from '../context/AuthContext'

// Mock axios
vi.mock('axios', () => ({
  default: {
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

const mockAuthContext = {
  user: { id: 1, name: 'Test User', role: 'customer' },
  logout: vi.fn(),
  loading: false,
  error: null
}

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: () => mockAuthContext
  }
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders brand logo and name', () => {
    renderWithRouter(<Navbar />)
    
    expect(screen.getByText('Sweet Shop')).toBeInTheDocument()
  })

  test('shows navigation links when user is authenticated', () => {
    renderWithRouter(<Navbar />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Shop')).toBeInTheDocument()
  })

  test('shows user name when authenticated', () => {
    renderWithRouter(<Navbar />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  test('shows admin link for admin users', () => {
    mockAuthContext.user.role = 'admin'
    
    renderWithRouter(<Navbar />)
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  test('shows logout option', () => {
    renderWithRouter(<Navbar />)
    
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  test('shows login/register links when not authenticated', () => {
    mockAuthContext.user = null
    
    renderWithRouter(<Navbar />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })
})
