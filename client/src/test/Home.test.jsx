import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Home from '../pages/Home'
import { AuthProvider } from '../context/AuthContext'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
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

// Mock useAuth hook
const mockAuthContext = {
  user: { id: 1, name: 'Test User', role: 'customer' },
  isAdmin: false,
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

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders welcome message for authenticated user', () => {
    renderWithRouter(<Home />)
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  test('shows navigation cards for customer', () => {
    renderWithRouter(<Home />)
    
    expect(screen.getByText('Shop Sweets')).toBeInTheDocument()
    expect(screen.getByText('Browse our delicious collection')).toBeInTheDocument()
  })

  test('shows admin dashboard link for admin users', () => {
    // Override mock for admin user
    mockAuthContext.user.role = 'admin'
    mockAuthContext.isAdmin = true
    
    renderWithRouter(<Home />)
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Manage inventory and sales')).toBeInTheDocument()
  })

  test('displays sweet shop branding', () => {
    renderWithRouter(<Home />)
    
    expect(screen.getByText(/sweet shop management/i)).toBeInTheDocument()
  })

  test('shows featured section', () => {
    renderWithRouter(<Home />)
    
    // Check for featured sweets or popular items section
    const featuredElements = screen.getAllByText(/featured|popular|bestseller/i)
    expect(featuredElements.length).toBeGreaterThan(0)
  })
})
