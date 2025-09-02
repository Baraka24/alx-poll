import { renderHook, act } from '@testing-library/react'
import { useAuthActions } from '@/lib/hooks/use-auth-actions'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase client
jest.mock('@/lib/supabase/client')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock Next.js router
const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('useAuthActions', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
      },
    }
    
    mockCreateClient.mockReturnValue(mockSupabaseClient)
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token' }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(signInResult.success).toBe(true)
      expect(signInResult.data.user).toEqual(mockUser)
      expect(mockPush).toHaveBeenCalledWith('/polls')
      expect(mockRefresh).toHaveBeenCalled()
      expect(result.current.error).toBeNull()
    })

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials' }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(signInResult.success).toBe(false)
      expect(signInResult.error).toBe('Invalid credentials')
      expect(result.current.error).toBe('Invalid credentials')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuthActions())

      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123')
      })

      expect(signInResult.success).toBe(false)
      expect(signInResult.error).toBe('Network error')
      expect(result.current.error).toBe('Network error')
    })

    it('should set loading state correctly', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: '123' }, session: {} },
          error: null
        }), 100))
      )

      const { result } = renderHook(() => useAuthActions())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.signIn('test@example.com', 'password123')
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('signUp', () => {
    it('should successfully sign up a user without email confirmation', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthActions())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123', 'John Doe')
      })

      expect(signUpResult.success).toBe(true)
      expect(signUpResult.data.user).toEqual(mockUser)
      expect(mockPush).toHaveBeenCalledWith('/polls')
      expect(mockRefresh).toHaveBeenCalled()
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'John Doe',
          },
        },
      })
    })

    it('should handle sign up requiring email confirmation', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuthActions())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123', 'John Doe')
      })

      expect(signUpResult.success).toBe(true)
      expect(signUpResult.requiresConfirmation).toBe(true)
      expect(signUpResult.message).toBe('Please check your email to confirm your account.')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already registered' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuthActions())

      let signUpResult: any
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123')
      })

      expect(signUpResult.success).toBe(false)
      expect(signUpResult.error).toBe('Email already registered')
      expect(result.current.error).toBe('Email already registered')
    })

    it('should handle missing full name', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuthActions())

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123')
      })

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: '',
          },
        },
      })
    })
  })

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuthActions())

      let signOutResult: any
      await act(async () => {
        signOutResult = await result.current.signOut()
      })

      expect(signOutResult.success).toBe(true)
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalled()
      expect(result.current.error).toBeNull()
    })

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed' }
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError,
      })

      const { result } = renderHook(() => useAuthActions())

      let signOutResult: any
      await act(async () => {
        signOutResult = await result.current.signOut()
      })

      expect(signOutResult.success).toBe(false)
      expect(signOutResult.error).toBe('Sign out failed')
      expect(result.current.error).toBe('Sign out failed')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      })

      const { result } = renderHook(() => useAuthActions())

      let resetResult: any
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com')
      })

      expect(resetResult.success).toBe(true)
      expect(resetResult.message).toBe('Password reset email sent. Please check your inbox.')
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/reset-password',
        }
      )
    })

    it('should handle password reset errors', async () => {
      const mockError = { message: 'Email not found' }
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: mockError,
      })

      const { result } = renderHook(() => useAuthActions())

      let resetResult: any
      await act(async () => {
        resetResult = await result.current.resetPassword('nonexistent@example.com')
      })

      expect(resetResult.success).toBe(false)
      expect(resetResult.error).toBe('Email not found')
      expect(result.current.error).toBe('Email not found')
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Test error' },
      })

      const { result } = renderHook(() => useAuthActions())

      await act(async () => {
        await result.current.signIn('test@example.com', 'wrongpassword')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
