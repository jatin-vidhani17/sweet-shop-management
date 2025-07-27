import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Shopping from '../pages/Shopping'
import { AuthProvider } from '../context/AuthContext'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
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

const mockAuthContext = {
  user: { id: 1, name: 'Customer User', role: 'customer' },
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

// Mock sweets data
const mockSweets = [
  {
    id: 1,
    name: 'Chocolate Cake',
    price: 25.99,
    description: 'Delicious chocolate cake',
    image: 'cake.jpg',
    category: 'cakes',
    stock: 10
  },
  {
    id: 2,
    name: 'Vanilla Cookies',
    price: 15.99,
    description: 'Sweet vanilla cookies',
    image: 'cookies.jpg',
    category: 'cookies',
    stock: 20
  }
]

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Shopping Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({ data: mockSweets })
  })

  test('renders shopping page header', () => {
    renderWithRouter(<Shopping />)
    
    expect(screen.getByText(/sweet collection/i)).toBeInTheDocument()
  })

  test('displays loading state initially', () => {
    renderWithRouter(<Shopping />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  test('displays sweets after loading', async () => {
    renderWithRouter(<Shopping />)
    
    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
      expect(screen.getByText('Vanilla Cookies')).toBeInTheDocument()
    })
  })

  test('shows sweet prices', async () => {
    renderWithRouter(<Shopping />)
    
    await waitFor(() => {
      expect(screen.getByText('$25.99')).toBeInTheDocument()
      expect(screen.getByText('$15.99')).toBeInTheDocument()
    })
  })

  test('shows add to cart buttons', async () => {
    renderWithRouter(<Shopping />)
    
    await waitFor(() => {
      const addToCartButtons = screen.getAllByText(/add to cart/i)
      expect(addToCartButtons).toHaveLength(2)
    })
  })

  test('filters sweets by category', async () => {
    const user = userEvent.setup()
    renderWithRouter(<Shopping />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
    })

    // Check if filter buttons exist
    const cakesFilter = screen.queryByText(/cakes/i)
    if (cakesFilter) {
      await user.click(cakesFilter)
      
      await waitFor(() => {
        expect(screen.getByText('Chocolate Cake')).toBeInTheDocument()
        expect(screen.queryByText('Vanilla Cookies')).not.toBeInTheDocument()
      })
    }
  })

  test('shows search functionality', () => {
    renderWithRouter(<Shopping />)
    
    const searchInput = screen.queryByPlaceholderText(/search/i)
    expect(searchInput).toBeInTheDocument()
  })

  test('displays sweet images', async () => {
    renderWithRouter(<Shopping />)
    
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
    })
  })
})
