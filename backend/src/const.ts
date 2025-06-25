const username = process.env.USER ?? '';
const password = encodeURIComponent(process.env.PASSWORD ?? '');
const database = process.env.DATABASE ?? '';
const cluster = process.env.CLUSTER ?? '';
const port = process.env.PORT ?? '5000';

const MONGO_URI = `mongodb+srv://${username}:${password}@${database}.${cluster}.mongodb.net/?retryWrites=true&w=majority&appName=${database}`;