import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AdminDashboard from '../pages/AdminDashboard'
import { AuthProvider } from '../context/AuthContext'

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: vi.fn(() => ({ onClick: vi.fn() })),
    getInputProps: vi.fn(() => ({})),
    isDragActive: false,
    acceptedFiles: []
  }))
}))

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}))

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false,
  })
}))

const mockAuthContext = {
  user: { id: 1, name: 'Admin User', role: 'admin' },
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

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders admin dashboard with main sections', () => {
    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  test('shows tab navigation', () => {
    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /inventory/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /orders/i })).toBeInTheDocument()
  })

  test('switches between tabs', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminDashboard />)
    
    const inventoryTab = screen.getByRole('tab', { name: /inventory/i })
    await user.click(inventoryTab)
    
    expect(screen.getByText('Add New Sweet')).toBeInTheDocument()
  })

  test('displays analytics charts', () => {
    renderWithRouter(<AdminDashboard />)
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  test('shows add sweet form in inventory tab', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminDashboard />)
    
    const inventoryTab = screen.getByRole('tab', { name: /inventory/i })
    await user.click(inventoryTab)
    
    expect(screen.getByLabelText(/sweet name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  test('shows file upload in inventory section', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AdminDashboard />)
    
    const inventoryTab = screen.getByRole('tab', { name: /inventory/i })
    await user.click(inventoryTab)
    
    expect(screen.getByTestId('dropzone')).toBeInTheDocument()
  })
})
