import type { Product as ApiProduct } from '../../api/product-service/product-api';
import type { Product } from '../template/DevStyle';

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/\b(tool|devtools|debugger|pipeline|vault|api)\b/.test(n)) return 'tools';
  if (/\b(ui|component|terminal)\b/.test(n)) return 'ui';
  if (/\bdevops|ci|cd\b/.test(n)) return 'devops';
  return 'libraries';
}

export function mapApiProductsToCatalog(products: ApiProduct[]): Product[] {
  return products.map((p, i) => ({
    id: i + 1,
    name: p.name,
    description: p.description,
    price: p.price,
    category: inferCategory(p.name),
    availability: p.availability,
    imageUrl: p.imageUrl,
    badge: undefined,
    stars: 4 + (i % 2),
    downloads: undefined,
    version: 'v1.0',
  }));
}
