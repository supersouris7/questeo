/**
 * Adresse du client d'une connexion temps réel, pour le seul limiteur de tentatives (jamais
 * journalisée ni conservée au-delà de sa fenêtre).
 */

/**
 * Même règle que les requêtes HTTP (`TRUST_PROXY`, proxy-addr) : on remonte `X-Forwarded-For`
 * d'autant de sauts qu'il y a de proxys de confiance ; au-delà, l'en-tête vient du client et
 * n'est pas cru.
 */
export function clientIp(
  remoteAddress: string,
  forwardedFor: string | readonly string[] | undefined,
  trustProxy: number,
): string {
  const forwarded = [forwardedFor ?? []]
    .flat()
    .join(',')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const chain = [remoteAddress, ...forwarded.reverse()];
  return chain[Math.min(trustProxy, chain.length - 1)] ?? remoteAddress;
}

/**
 * Clé de comptage : l'adresse IPv4, ou le préfixe /64 d'une adresse IPv6 (un même abonné dispose
 * de tout le préfixe : changer d'adresse ne doit pas remettre le compteur à zéro).
 */
export function rateKey(ip: string): string {
  const address = ip.toLowerCase().replace(/%.*$/, '');
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address)?.[1];
  if (mapped) return mapped;
  if (!address.includes(':')) return address;
  const [head = '', tail] = address.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const zeros = tail === undefined ? 0 : Math.max(0, 8 - left.length - right.length);
  const groups = [...left, ...Array<string>(zeros).fill('0'), ...right];
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ''))
    .join(':')}::/64`;
}
