import { api } from './lib/api';

async function test() {
  try {
    const newClient = await api.addClient({ name: 'Test Client', phone: '123456789', address: 'Test Address' });
    console.log('Success:', newClient);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
