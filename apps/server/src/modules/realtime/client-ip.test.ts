import { describe, expect, it } from 'vitest';
import { clientIp, rateKey } from './client-ip.ts';

describe('adresse du client', () => {
  it('sans proxy de confiance : l’en-tête n’est pas cru', () => {
    expect(clientIp('10.0.0.1', '203.0.113.7', 0)).toBe('10.0.0.1');
  });

  it('derrière un ou deux proxys : le saut ajouté par le proxy de confiance, pas celui du client', () => {
    expect(clientIp('10.0.0.1', '1.2.3.4, 203.0.113.7', 1)).toBe('203.0.113.7');
    expect(clientIp('10.0.0.1', ['1.2.3.4', '203.0.113.7, 10.0.0.2'], 2)).toBe('203.0.113.7');
  });

  it('moins de sauts que prévu : le plus éloigné connu', () => {
    expect(clientIp('10.0.0.1', undefined, 2)).toBe('10.0.0.1');
    expect(clientIp('10.0.0.1', '203.0.113.7', 3)).toBe('203.0.113.7');
  });

  it('clé de comptage : IPv4, ou préfixe /64 en IPv6', () => {
    expect(rateKey('203.0.113.7')).toBe('203.0.113.7');
    expect(rateKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(rateKey('2001:0DB8:0001:0002:aaaa::1')).toBe('2001:db8:1:2::/64');
    expect(rateKey('2001:db8:1:2::9')).toBe('2001:db8:1:2::/64');
    expect(rateKey('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(rateKey('::1')).toBe('0:0:0:0::/64');
  });
});
