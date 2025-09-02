import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '@/components/auth/register-form'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'

// Mock the useAuthActions hook
jest.mock('@/lib/hooks/use-auth-actions')
const mockUseAuthActions = useAuthActions as jest.MockedFunction<typeof useAuthActions>

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockedLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

describe('RegisterForm Integration Tests', () => {
  const mockSignUp = jest.fn()
  const mockSignIn = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuthActions.mockReturnValue({
      signUp: mockSignUp,
      signIn: mockSignIn,
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  describe('Form Rendering and Validation', () => {
    it('should render all form fields', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    })

    it('should show password validation errors', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      
      await user.type(passwordInput, '123')
      await user.tab() // Blur the input

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should show password mismatch error', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeDisabled()

      // Fill in partial form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      
      expect(submitButton).toBeDisabled()

      // Complete form with valid data
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      expect(submitButton).not.toBeDisabled()
    })

    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const toggleButton = passwordInput.parentElement?.querySelector('button')

      expect(passwordInput).toHaveAttribute('type', 'password')

      if (toggleButton) {
        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')

        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })
  })

  describe('Form Submission - Success Cases', () => {
    it('should handle successful registration requiring email confirmation', async () => {
      const user = userEvent.setup()
      
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true
      })

      render(<RegisterForm />)

      // Fill out the form
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      // Submit the form
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe')
      })

      await waitFor(() => {
        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/check your email inbox/i)).toBeInTheDocument()
        expect(screen.getByText(/go to sign in page/i)).toBeInTheDocument()
        expect(screen.getByText(/sign in now/i)).toBeInTheDocument()
      })
    })

    it('should handle successful registration with immediate login', async () => {
      const user = userEvent.setup()
      
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: false
      })

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/account created and signed in successfully/i)).toBeInTheDocument()
      })
    })

    it('should allow direct login after registration', async () => {
      const user = userEvent.setup()
      
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true
      })
      
      mockSignIn.mockResolvedValue({
        success: true
      })

      render(<RegisterForm />)

      // Complete registration
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/sign in now/i)).toBeInTheDocument()
      })

      // Click "Sign In Now" button
      await user.click(screen.getByRole('button', { name: /sign in now/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('john@example.com', 'password123')
      })
    })
  })

  describe('Form Submission - Error Cases', () => {
    it('should display registration errors', async () => {
      const user = userEvent.setup()
      
      mockSignUp.mockResolvedValue({
        success: false,
        error: 'Email already registered'
      })

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
      })
    })

    it('should handle direct login failure', async () => {
      const user = userEvent.setup()
      
      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true
      })
      
      mockSignIn.mockResolvedValue({
        success: false,
        error: 'Email not confirmed'
      })

      render(<RegisterForm />)

      // Complete registration
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/sign in now/i)).toBeInTheDocument()
      })

      // Attempt direct login
      await user.click(screen.getByRole('button', { name: /sign in now/i }))

      await waitFor(() => {
        expect(screen.getByText(/email not confirmed/i)).toBeInTheDocument()
      })
    })

    it('should prevent submission with invalid form data', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeDisabled()

      // Try with mismatched passwords
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different123')

      expect(submitButton).toBeDisabled()
      expect(mockSignUp).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during registration', async () => {
      const user = userEvent.setup()
      
      mockUseAuthActions.mockReturnValue({
        signUp: mockSignUp,
        signIn: mockSignIn,
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<RegisterForm />)

      expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })

    it('should show loading state during direct login', async () => {
      const user = userEvent.setup()
      
      // First render with normal state
      const { rerender } = render(<RegisterForm />)

      mockSignUp.mockResolvedValue({
        success: true,
        requiresConfirmation: true
      })

      // Complete registration
      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /create account/i }))

      // Rerender with loading state
      mockUseAuthActions.mockReturnValue({
        signUp: mockSignUp,
        signIn: mockSignIn,
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      rerender(<RegisterForm />)

      await waitFor(() => {
        const signingInButton = screen.getByRole('button', { name: /signing in/i })
        expect(signingInButton).toBeInTheDocument()
        expect(signingInButton).toBeDisabled()
      })
    })
  })

  describe('Error Clearing', () => {
    it('should clear errors on new form submission', async () => {
      const user = userEvent.setup()
      
      mockUseAuthActions.mockReturnValue({
        signUp: mockSignUp,
        signIn: mockSignIn,
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        isLoading: false,
        error: 'Previous error',
        clearError: mockClearError,
      })

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/full name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'password123')

      await user.click(screen.getByRole('button', { name: /create account/i }))

      expect(mockClearError).toHaveBeenCalled()
    })
  })
})
