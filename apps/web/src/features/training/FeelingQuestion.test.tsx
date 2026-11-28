import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeelingQuestion } from './FeelingQuestion.tsx';

describe('« Je me sens capable ? » : transparence', () => {
  it('annonce à l’enfant que ses parents verront ses réponses, pas à un adulte', () => {
    const { rerender } = render(<FeelingQuestion sessionId="s" adult={false} />);
    expect(screen.getByText('Tes parents verront tes réponses.')).toBeInTheDocument();
    rerender(<FeelingQuestion sessionId="s" adult />);
    expect(screen.queryByText(/Tes parents/)).not.toBeInTheDocument();
  });
});
