import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BecomeAgent from './BecomeAgent';

// Mock component wrapper with router
const BecomeAgentWithRouter = () => (
  <BrowserRouter>
    <BecomeAgent />
  </BrowserRouter>
);

describe('BecomeAgent Component', () => {
  test('renders the page title correctly', () => {
    render(<BecomeAgentWithRouter />);
    expect(screen.getByText('Become Atlas-WD Agent')).toBeInTheDocument();
    expect(screen.getByText('Earn high commissions and offer your customers reliable products as Atlas-WD Agent')).toBeInTheDocument();
  });

  test('renders all form fields', () => {
    render(<BecomeAgentWithRouter />);
    
    // Check for form fields
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select means of identity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/id\/id number/i)).toBeInTheDocument();
  });

  test('shows success modal when form is submitted', () => {
    render(<BecomeAgentWithRouter />);
    
    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/bank name/i), { target: { value: 'Test Bank' } });
    fireEvent.change(screen.getByLabelText(/account number/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/account name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/select means of identity/i), { target: { value: 'passport' } });
    fireEvent.change(screen.getByLabelText(/id\/id number/i), { target: { value: 'P123456789' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Submit Request'));
    
    // Check if success modal appears
    expect(screen.getByText('Request Submitted Successfully')).toBeInTheDocument();
    expect(screen.getByText(/thank you for submitting your application/i)).toBeInTheDocument();
  });

  test('closes success modal when Got it button is clicked', () => {
    render(<BecomeAgentWithRouter />);
    
    // Fill and submit form (simplified)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/bank name/i), { target: { value: 'Test Bank' } });
    fireEvent.change(screen.getByLabelText(/account number/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByLabelText(/account name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/select means of identity/i), { target: { value: 'passport' } });
    fireEvent.change(screen.getByLabelText(/id\/id number/i), { target: { value: 'P123456789' } });
    
    fireEvent.click(screen.getByText('Submit Request'));
    
    // Modal should be visible
    expect(screen.getByText('Request Submitted Successfully')).toBeInTheDocument();
    
    // Click Got it button
    fireEvent.click(screen.getByText('Got it'));
    
    // Modal should be closed
    expect(screen.queryByText('Request Submitted Successfully')).not.toBeInTheDocument();
  });

  test('navigation links work correctly', () => {
    render(<BecomeAgentWithRouter />);
    
    // Check if logo link exists
    const logoLink = screen.getByRole('link', { name: /atlas-wd/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
