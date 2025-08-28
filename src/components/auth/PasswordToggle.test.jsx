import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompleteRegistration from './CompleteRegistration';

// Mock AuthModal component
jest.mock('./AuthModal', () => {
  return function MockAuthModal({ children }) {
    return <div data-testid="auth-modal">{children}</div>;
  };
});

describe('Password Show/Hide Functionality', () => {
  const mockProps = {
    email: 'test@example.com',
    onComplete: jest.fn(),
    onBack: jest.fn()
  };

  test('password field toggles between password and text type', () => {
    render(<CompleteRegistration {...mockProps} />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = passwordInput.parentElement.querySelector('button');
    
    // Initially should be password type
    expect(passwordInput.type).toBe('password');
    
    // Click toggle button
    fireEvent.click(toggleButton);
    
    // Should now be text type
    expect(passwordInput.type).toBe('text');
    
    // Click again
    fireEvent.click(toggleButton);
    
    // Should be back to password type
    expect(passwordInput.type).toBe('password');
  });

  test('confirm password field toggles between password and text type', () => {
    render(<CompleteRegistration {...mockProps} />);
    
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const toggleButton = confirmPasswordInput.parentElement.querySelector('button');
    
    // Initially should be password type
    expect(confirmPasswordInput.type).toBe('password');
    
    // Click toggle button
    fireEvent.click(toggleButton);
    
    // Should now be text type
    expect(confirmPasswordInput.type).toBe('text');
    
    // Click again
    fireEvent.click(toggleButton);
    
    // Should be back to password type
    expect(confirmPasswordInput.type).toBe('password');
  });

  test('password and confirm password toggles work independently', () => {
    render(<CompleteRegistration {...mockProps} />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    
    const passwordToggle = passwordInput.parentElement.querySelector('button');
    const confirmPasswordToggle = confirmPasswordInput.parentElement.querySelector('button');
    
    // Toggle password field
    fireEvent.click(passwordToggle);
    expect(passwordInput.type).toBe('text');
    expect(confirmPasswordInput.type).toBe('password'); // Should remain password
    
    // Toggle confirm password field
    fireEvent.click(confirmPasswordToggle);
    expect(passwordInput.type).toBe('text'); // Should remain text
    expect(confirmPasswordInput.type).toBe('text');
    
    // Toggle password field back
    fireEvent.click(passwordToggle);
    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('text'); // Should remain text
  });

  test('eye icons change when toggling password visibility', () => {
    render(<CompleteRegistration {...mockProps} />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = passwordInput.parentElement.querySelector('button');
    const eyeIcon = toggleButton.querySelector('svg');
    
    // Initially should show "eye" icon (password hidden)
    expect(eyeIcon.querySelector('path').getAttribute('d')).toContain('M15 12a3 3 0 11-6 0');
    
    // Click to show password
    fireEvent.click(toggleButton);
    
    // Should now show "eye-slash" icon (password visible)
    expect(eyeIcon.querySelector('path').getAttribute('d')).toContain('M13.875 18.825');
  });
});
