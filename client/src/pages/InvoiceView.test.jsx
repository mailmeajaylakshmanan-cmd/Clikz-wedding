import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvoiceView from './InvoiceView';
import { BrowserRouter } from 'react-router-dom';

import { vi, describe, it, expect } from 'vitest';

// Mock the API and Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-invoice-123' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        _id: 'test-invoice-123',
        invoiceNo: 'CWF-0011',
        date: '2026-07-15',
        services: [
          { service: 'CANDID PHOTOGRAPHY, TRADITIONAL VIDEOGRAPHY', description: 'Main events', amount: 100000 }
        ],
        subTotal: 100000,
        total: 100000
      }
    })
  }
}));

describe('InvoiceView Component', () => {
  it('renders the invoice successfully and splits comma-separated services correctly', async () => {
    render(
      <BrowserRouter>
        <InvoiceView />
      </BrowserRouter>
    );

    // Wait for the mock API data to populate
    await waitFor(() => {
      expect(screen.getByText('CWF-0011')).toBeInTheDocument();
    });

    // Verify comma-separated strings are dynamically split into separate items
    expect(screen.getByText('CANDID PHOTOGRAPHY')).toBeInTheDocument();
    expect(screen.getByText('TRADITIONAL VIDEOGRAPHY')).toBeInTheDocument();
  });

  it('opens the Share/WhatsApp modal without crashing (checking FileText import)', async () => {
    render(
      <BrowserRouter>
        <InvoiceView />
      </BrowserRouter>
    );

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('CWF-0011')).toBeInTheDocument();
    });

    // Find and click the WhatsApp share button
    const shareButton = screen.getByText('WhatsApp');
    fireEvent.click(shareButton);

    // If FileText is missing, React throws a runtime ReferenceError here causing a blank screen.
    // We assert that the modal successfully renders by checking its content:
    expect(screen.getByText('Share Document')).toBeInTheDocument();
    expect(screen.getByText(/Send the PDF directly via WhatsApp/i)).toBeInTheDocument();
    
    // Check that the file name is generated in the modal
    expect(screen.getByText('CLIKZ-Invoice-CWF-0011.pdf')).toBeInTheDocument();
  });
});
