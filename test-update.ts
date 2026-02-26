import { api } from './lib/api';

async function test() {
  try {
    const sales = await api.getSales();
    if (sales.length > 0) {
      const sale = sales[0];
      await api.updateSale(sale.id, { paymentHistory: [] } as any);
      console.log('Success');
    }
  } catch (e) {
    console.error(e);
  }
}
test();
