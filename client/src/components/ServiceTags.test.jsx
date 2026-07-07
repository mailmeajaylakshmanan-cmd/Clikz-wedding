import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // For the "toBeInTheDocument" and "toHaveStyle" matchers
import ServiceTags from './ServiceTags';

describe('ServiceTags Component', () => {
  it('successfully splits the comma-separated string and renders each item as an individual tag', () => {
    const testString = 'Photography, Videography, Cinematic Edit';
    render(<ServiceTags servicesString={testString} />);

    // Assert that the string was split and mapped correctly
    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(screen.getByText('Videography')).toBeInTheDocument();
    expect(screen.getByText('Cinematic Edit')).toBeInTheDocument();
  });

  it('wraps the tags in a container with the correct flexbox alignment properties', () => {
    const testString = 'Photography, Videography';
    const { container } = render(<ServiceTags servicesString={testString} />);

    // The component returns a top-level div holding the spans.
    const wrapperDiv = container.firstChild;

    // Verify that the wrapper has the exact CSS required for responsive wrapping
    expect(wrapperDiv).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    });
  });

  it('renders nothing when an empty string or no string is provided', () => {
    const { container: container1 } = render(<ServiceTags servicesString="" />);
    expect(container1.firstChild).toBeNull();

    const { container: container2 } = render(<ServiceTags />);
    expect(container2.firstChild).toBeNull();
  });

  it('ignores trailing commas and empty spaces', () => {
    const testString = ' Photography , , Videography, ';
    render(<ServiceTags servicesString={testString} />);

    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(screen.getByText('Videography')).toBeInTheDocument();
    // It shouldn't render any empty tags
    const tags = screen.getAllByText(/[a-zA-Z]/);
    expect(tags).toHaveLength(2);
  });
});
